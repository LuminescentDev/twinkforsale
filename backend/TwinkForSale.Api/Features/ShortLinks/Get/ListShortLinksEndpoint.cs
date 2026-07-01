using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks.Get;

public sealed class ListShortLinksEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ListShortLinksResponse>
{
    public override void Configure()
    {
        Get("/api/short-links");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var links = await dbContext.ShortLinks
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ShortLinkListItem(
                x.Id,
                x.Code,
                x.Url,
                x.Clicks,
                x.MaxClicks,
                x.CreatedAt,
                x.ExpiresAt,
                x.LastClicked))
            .ToListAsync(ct);

        await SendOkAsync(new ListShortLinksResponse(links), ct);
    }
}

public sealed record ListShortLinksResponse(IReadOnlyList<ShortLinkListItem> Links);

public sealed record ShortLinkListItem(
    string Id,
    string Code,
    string Url,
    int Clicks,
    int? MaxClicks,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ExpiresAt,
    DateTimeOffset? LastClicked);
