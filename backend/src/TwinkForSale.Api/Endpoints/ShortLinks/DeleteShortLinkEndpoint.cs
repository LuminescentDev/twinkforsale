using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ShortLinks;

public class DeleteShortLinkRequest
{
    public string Id { get; set; } = null!;
}

public class DeleteShortLinkEndpoint : Endpoint<DeleteShortLinkRequest>
{
    private readonly AppDbContext _db;
    private readonly ILogger<DeleteShortLinkEndpoint> _logger;

    public DeleteShortLinkEndpoint(AppDbContext db, ILogger<DeleteShortLinkEndpoint> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override void Configure()
    {
        Delete("/short-links/{Id}");
        AuthSchemes("JWT", "ApiKey");
        Description(x => x.WithTags("Short Links"));
    }

    public override async Task HandleAsync(DeleteShortLinkRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var link = await _db.ShortLinks
            .FirstOrDefaultAsync(s => s.Id == req.Id && s.UserId == userId, ct);

        if (link == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        _db.ShortLinks.Remove(link);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Short link deleted: {LinkId} by user {UserId}", req.Id, userId);

        HttpContext.Response.StatusCode = 204;
    }
}
