using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public record ApiKeyDto(
    string Id,
    string Name,
    string KeyPrefix,
    bool IsActive,
    DateTime? LastUsedAt,
    DateTime CreatedAt,
    DateTime? ExpiresAt
);

public class ListApiKeys(AppDbContext db) : EndpointWithoutRequest<List<ApiKeyDto>>
{
    public override void Configure()
    {
        Get("/api-keys");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var keys = await db.ApiKeys
            .Where(k => k.UserId == userId)
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyDto(
                k.Id,
                k.Name,
                k.Key.Substring(0, 8) + "...",
                k.IsActive,
                k.LastUsedAt,
                k.CreatedAt,
                k.ExpiresAt
            ))
            .ToListAsync(ct);

        await SendAsync(keys, cancellation: ct);
    }
}
