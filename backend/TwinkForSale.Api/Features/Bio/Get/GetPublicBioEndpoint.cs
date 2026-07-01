using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio.Get;

public sealed class GetPublicBioEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<BioResponse>
{
    public override void Configure()
    {
        Get("/api/public/bio/{username}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var username = Route<string>("username");
        var settings = await dbContext.UserSettings.FirstOrDefaultAsync(x => x.BioUsername == username && x.BioIsPublic, ct);
        if (settings is null) { await SendNotFoundAsync(ct); return; }

        settings.BioViews++;
        settings.BioLastViewed = DateTimeOffset.UtcNow;
        dbContext.BioViews.Add(new Domain.Entities.BioView
        {
            UserId = settings.UserId,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = HttpContext.Request.Headers.UserAgent,
            Referer = HttpContext.Request.Headers.Referer
        });

        var links = await dbContext.BioLinks.AsNoTracking()
            .Where(x => x.UserId == settings.UserId && x.IsActive)
            .OrderBy(x => x.Order)
            .Select(x => new BioLinkDto(x.Id, x.Title, x.Url, x.Icon, x.Order, x.IsActive, x.Clicks))
            .ToListAsync(ct);

        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(BioResponse.From(settings, links), ct);
    }
}
