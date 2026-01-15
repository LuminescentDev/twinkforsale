using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public class LatestApiKeyResponse
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Key { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class GetLatestApiKeyEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/api-keys/latest");
        AuthSchemes("JWT");
        Description(x => x.WithTags("ApiKeys"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var apiKey = await _db.ApiKeys
            .Where(k => k.UserId == userId && k.IsActive)
            .OrderByDescending(k => k.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (apiKey == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var response = new LatestApiKeyResponse
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            Key = apiKey.Key,
            CreatedAt = apiKey.CreatedAt,
            ExpiresAt = apiKey.ExpiresAt
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
