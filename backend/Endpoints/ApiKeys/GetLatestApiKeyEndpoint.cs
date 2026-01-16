using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public record LatestApiKeyResponse(string Id, string Name, string Key, DateTime CreatedAt, DateTime? ExpiresAt);

public class GetLatestApiKeyEndpoint(AppDbContext db) : EndpointWithoutRequest<LatestApiKeyResponse>
{
    public override void Configure()
    {
        Get("/api-keys/latest");
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

        var apiKey = await db.ApiKeys
            .Where(k => k.UserId == userId && k.IsActive)
            .OrderByDescending(k => k.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (apiKey == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendAsync(
            new LatestApiKeyResponse(apiKey.Id, apiKey.Name, apiKey.Key, apiKey.CreatedAt, apiKey.ExpiresAt),
            cancellation: ct);
    }
}
