using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public class DeleteApiKeyRequest
{
    public string Id { get; set; } = null!;
}

public class DeleteApiKeyEndpoint(AppDbContext db, ILogger<DeleteApiKeyEndpoint> logger) : Endpoint<DeleteApiKeyRequest>
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<DeleteApiKeyEndpoint> _logger = logger;

  public override void Configure()
    {
        Delete("/api-keys/{Id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("API Keys"));
    }

    public override async Task HandleAsync(DeleteApiKeyRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var apiKey = await _db.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == req.Id && k.UserId == userId, ct);

        if (apiKey == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        _db.ApiKeys.Remove(apiKey);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("API key deleted: {KeyId} by user {UserId}", req.Id, userId);

        HttpContext.Response.StatusCode = 204;
    }
}
