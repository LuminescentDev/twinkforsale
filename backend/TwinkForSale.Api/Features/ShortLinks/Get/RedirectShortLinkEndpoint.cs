using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks.Get;

public sealed class RedirectShortLinkEndpoint(AppDbContext dbContext) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.HEAD);
        Routes("/l/{code}");
        AllowAnonymous();
        Summary(summary =>
        {
            summary.Summary = "Redirects a short link.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        var code = Route<string>("code");
        var link = await dbContext.ShortLinks.AsNoTracking().FirstOrDefaultAsync(x => x.Code == code, ct);

        if (link is null || link.IsPaused || link.ExpiresAt <= DateTimeOffset.UtcNow ||
            (link.MaxClicks is not null && link.Clicks >= link.MaxClicks))
        {
            await SendNotFoundAsync(ct);
            return;
        }

        if (!HttpMethods.IsHead(HttpContext.Request.Method))
        {
            var now = DateTimeOffset.UtcNow;
            var updated = await dbContext.ShortLinks
                .Where(x => x.Id == link.Id && !x.IsPaused && x.Url == link.Url && (x.ExpiresAt == null || x.ExpiresAt > now) &&
                    (x.MaxClicks == null || x.Clicks < x.MaxClicks))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.Clicks, x => x.Clicks + 1)
                    .SetProperty(x => x.LastClicked, now), ct);
            if (updated == 0)
            {
                await SendNotFoundAsync(ct);
                return;
            }
        }

        await SendRedirectAsync(link.Url, isPermanent: false, allowRemoteRedirects: true);
    }
}
