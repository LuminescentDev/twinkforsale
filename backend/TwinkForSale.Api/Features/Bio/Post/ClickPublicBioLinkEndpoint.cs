using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio.Post;

public sealed class ClickPublicBioLinkEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ClickBioLinkResponse>
{
    public override void Configure()
    {
        Post("/api/public/bio-links/{id}/click");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id");
        var link = await dbContext.BioLinks.FirstOrDefaultAsync(x => x.Id == id && x.IsActive, ct);
        if (link is null) { await SendNotFoundAsync(ct); return; }
        link.Clicks++;
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new ClickBioLinkResponse(true, link.Url), ct);
    }
}

public sealed record ClickBioLinkResponse(bool Success, string Url);
