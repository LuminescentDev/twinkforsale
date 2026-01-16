using System.Security.Claims;
using System.Security.Cryptography;
using FastEndpoints;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public record CreateApiKeyRequest(string Name, DateTime? ExpiresAt);

public record CreateApiKeyResponse(string Id, string Name, string Key, DateTime CreatedAt, DateTime? ExpiresAt);

public class CreateApiKeyEndpoint(AppDbContext db, ILogger<CreateApiKeyEndpoint> logger) : Endpoint<CreateApiKeyRequest, CreateApiKeyResponse>
{
    public override void Configure()
    {
        Post("/api-keys");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(CreateApiKeyRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(req.Name))
        {
            AddError("Name is required");
            await SendErrorsAsync(400, ct);
            return;
        }

        // Generate secure API key
        var keyBytes = RandomNumberGenerator.GetBytes(32);
        var key = $"tfs_{Convert.ToBase64String(keyBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=')}";

        var apiKey = new ApiKey
        {
            UserId = userId,
            Name = req.Name.Trim(),
            Key = key,
            IsActive = true,
            ExpiresAt = req.ExpiresAt
        };

        db.ApiKeys.Add(apiKey);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("API key created: {KeyId} for user {UserId}", apiKey.Id, userId);

        await SendAsync(
            new CreateApiKeyResponse(apiKey.Id, apiKey.Name, key, apiKey.CreatedAt, apiKey.ExpiresAt),
            201,
            ct);
    }
}
