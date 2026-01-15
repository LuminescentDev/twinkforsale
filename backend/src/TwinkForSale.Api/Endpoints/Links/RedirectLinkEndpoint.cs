using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Links;

public class RedirectLinkRequest
{
    public string Code { get; set; } = null!;
}

public class RedirectLinkEndpoint : Endpoint<RedirectLinkRequest>
{
    private readonly AppDbContext _db;
    private readonly ILogger<RedirectLinkEndpoint> _logger;

    public RedirectLinkEndpoint(AppDbContext db, ILogger<RedirectLinkEndpoint> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/l/{Code}");
        AllowAnonymous();
        Description(x => x.WithTags("Links"));
    }

    public override async Task HandleAsync(RedirectLinkRequest req, CancellationToken ct)
    {
        var shortLink = await _db.ShortLinks
            .FirstOrDefaultAsync(s => s.Code == req.Code && s.IsActive, ct);

        if (shortLink == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        // Log click
        try
        {
            shortLink.ClickCount++;
            shortLink.LastClickedAt = DateTime.UtcNow;

            var clickLog = new ClickLog
            {
                ShortLinkId = shortLink.Id,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = HttpContext.Request.Headers.UserAgent.ToString(),
                Referrer = HttpContext.Request.Headers.Referer.ToString()
            };

            _db.ClickLogs.Add(clickLog);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log click for short link {Code}", req.Code);
        }

        // Redirect to target URL
        HttpContext.Response.Redirect(shortLink.TargetUrl, permanent: false);
    }
}
