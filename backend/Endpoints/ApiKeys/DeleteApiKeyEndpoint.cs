using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public record DeleteApiKeyRequest(string Id);

public class DeleteApiKeyEndpoint(AppDbContext db, ILogger<DeleteApiKeyEndpoint> logger) : Endpoint<DeleteApiKeyRequest>
{
    public override void Configure()
    {
        Delete("/api-keys/{Id}");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(DeleteApiKeyRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var apiKey = await db.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == req.Id && k.UserId == userId, ct);

        if (apiKey == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        db.ApiKeys.Remove(apiKey);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("API key deleted: {KeyId} by user {UserId}", req.Id, userId);

        await SendNoContentAsync(ct);
    }
}
