using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks.Post;

public sealed class CreateShortLinkEndpoint(
    AppDbContext dbContext,
    ShortLinkCodeGenerator codeGenerator) : Endpoint<CreateShortLinkRequest, CreateShortLinkResponse>
{
    public override void Configure()
    {
        Post("/short-links", "/shorten");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
        Summary(summary =>
        {
            summary.Summary = "Creates a short link.";
            summary.Description = "API-key protected URL shortener endpoint.";
        });
    }

    public override async Task HandleAsync(CreateShortLinkRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendAsync(new CreateShortLinkResponse(Error: "Authentication required."), StatusCodes.Status401Unauthorized, ct);
            return;
        }

        if (!Uri.TryCreate(req.Url?.Trim(), UriKind.Absolute, out var targetUri) ||
            targetUri.Scheme is not ("http" or "https"))
        {
            await SendAsync(new CreateShortLinkResponse(Error: "Invalid URL. Must start with http(s)://"), StatusCodes.Status400BadRequest, ct);
            return;
        }

        var user = await dbContext.Users
            .Include(x => x.Settings)
            .FirstAsync(x => x.Id == userId, ct);

        var apiKeyId = User.FindFirstValue(AppClaimTypes.ApiKeyId);
        if (!string.IsNullOrWhiteSpace(apiKeyId))
        {
            await dbContext.ApiKeys
                .Where(x => x.Id == apiKeyId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.LastUsed, DateTimeOffset.UtcNow), ct);
        }

        var existing = await dbContext.ShortLinks.FirstOrDefaultAsync(x => x.UserId == user.Id && x.Url == targetUri.ToString(), ct);
        if (existing is not null)
        {
            await SendAsync(new CreateShortLinkResponse(Error: "duplicate_url", Code: existing.Code, Target: existing.Url), StatusCodes.Status409Conflict, ct);
            return;
        }

        var limit = user.Settings?.MaxShortLinks ?? 500;
        var currentCount = await dbContext.ShortLinks.CountAsync(x => x.UserId == user.Id, ct);
        if (currentCount >= limit)
        {
            await SendAsync(new CreateShortLinkResponse(Error: "Short link limit exceeded."), StatusCodes.Status429TooManyRequests, ct);
            return;
        }

        var code = string.IsNullOrWhiteSpace(req.Code) ? await codeGenerator.GenerateUniqueCodeAsync(ct) : req.Code.Trim();
        if (!IsValidCode(code))
        {
            await SendAsync(new CreateShortLinkResponse(Error: "Custom code must be 3-32 characters: letters, numbers, - or _."), StatusCodes.Status400BadRequest, ct);
            return;
        }

        if (await dbContext.ShortLinks.AnyAsync(x => x.Code == code, ct))
        {
            await SendAsync(new CreateShortLinkResponse(Error: "Code already in use."), StatusCodes.Status409Conflict, ct);
            return;
        }

        DateTimeOffset? expiresAt = req.ExpiresDays is > 0 ? DateTimeOffset.UtcNow.AddDays(req.ExpiresDays.Value) : null;
        var link = new ShortLink
        {
            Code = code,
            Url = targetUri.ToString(),
            UserId = user.Id,
            ExpiresAt = expiresAt,
            MaxClicks = req.MaxClicks
        };

        dbContext.ShortLinks.Add(link);
        await dbContext.SaveChangesAsync(ct);

        var origin = $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host}";
        await SendAsync(new CreateShortLinkResponse(Code: code, Url: $"{origin}/l/{code}", Target: link.Url, ExpiresAt: expiresAt), StatusCodes.Status201Created, ct);
    }

    private static bool IsValidCode(string code)
    {
        return code.Length is >= 3 and <= 32 && code.All(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_');
    }
}

public sealed record CreateShortLinkRequest(string? Url, string? Code, int? ExpiresDays, int? MaxClicks);

public sealed record CreateShortLinkResponse(
    string? Code = null,
    string? Url = null,
    string? Target = null,
    DateTimeOffset? ExpiresAt = null,
    string? Error = null);
