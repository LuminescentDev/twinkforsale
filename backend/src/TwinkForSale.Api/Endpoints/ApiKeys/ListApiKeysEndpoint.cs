using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public class ApiKeyDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string KeyPrefix { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class ListApiKeysEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;

    public ListApiKeysEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Get("/api-keys");
        AuthSchemes("JWT");
        Description(x => x.WithTags("API Keys"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var keys = await _db.ApiKeys
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto
            {
                Id = k.Id,
                Name = k.Name,
                KeyPrefix = k.Key.Substring(0, 8) + "...",
                IsActive = k.IsActive,
                LastUsedAt = k.LastUsedAt,
                CreatedAt = k.CreatedAt,
                ExpiresAt = k.ExpiresAt
            })
            .ToListAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, keys, (JsonSerializerOptions?)null, ct);
    }
}
