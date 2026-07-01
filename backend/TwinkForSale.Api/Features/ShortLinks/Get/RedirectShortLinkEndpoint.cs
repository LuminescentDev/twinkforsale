using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks.Get;

public sealed class RedirectShortLinkEndpoint(AppDbContext dbContext) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/l/{code}");
        AllowAnonymous();
        Summary(summary =>
        {
            summary.Summary = "Redirects a short link.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var code = Route<string>("code");
        var link = await dbContext.ShortLinks.FirstOrDefaultAsync(x => x.Code == code, ct);

        if (link is null || link.ExpiresAt < DateTimeOffset.UtcNow ||
            (link.MaxClicks is not null && link.Clicks >= link.MaxClicks))
        {
            await SendNotFoundAsync(ct);
            return;
        }

        link.Clicks++;
        link.LastClicked = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await SendRedirectAsync(link.Url, isPermanent: false);
    }
}
