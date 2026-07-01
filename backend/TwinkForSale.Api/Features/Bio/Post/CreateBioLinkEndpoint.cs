using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio.Post;

public sealed class CreateBioLinkEndpoint(AppDbContext dbContext) : Endpoint<CreateBioLinkRequest, BioLinkMutationResponse>
{
    public override void Configure()
    {
        Post("/api/bio/links");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CreateBioLinkRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }
        if (!Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
        {
            await SendAsync(new BioLinkMutationResponse(false, null, "Invalid URL."), StatusCodes.Status400BadRequest, ct);
            return;
        }

        var nextOrder = (await dbContext.BioLinks.Where(x => x.UserId == userId).MaxAsync(x => (int?)x.Order, ct) ?? -1) + 1;
        var link = new BioLink
        {
            UserId = userId,
            Title = req.Title.Trim(),
            Url = uri.ToString(),
            Icon = req.Icon,
            Order = req.Order ?? nextOrder,
            IsActive = req.IsActive ?? true
        };
        dbContext.BioLinks.Add(link);
        await dbContext.SaveChangesAsync(ct);
        await SendAsync(new BioLinkMutationResponse(true, link.Id), StatusCodes.Status201Created, ct);
    }
}

public sealed record CreateBioLinkRequest(string Title, string Url, string? Icon, int? Order, bool? IsActive);
public sealed record BioLinkMutationResponse(bool Success, string? Id = null, string? Error = null);
