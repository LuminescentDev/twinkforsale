using FastEndpoints;
using System.Security.Cryptography;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ApiKeys.Post;

public sealed class CreateApiKeyEndpoint(AppDbContext dbContext) : Endpoint<CreateApiKeyRequest, CreateApiKeyResponse>
{
    public override void Configure()
    {
        Post("/api/api-keys");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CreateApiKeyRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var name = string.IsNullOrWhiteSpace(req.Name) ? "API Key" : req.Name.Trim();
        var apiKey = new ApiKey
        {
            UserId = userId,
            Name = name,
            Key = $"tfs_{Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant()}",
            CreatedAt = DateTimeOffset.UtcNow,
            IsActive = true
        };

        dbContext.ApiKeys.Add(apiKey);
        await dbContext.SaveChangesAsync(ct);

        await SendAsync(new CreateApiKeyResponse(apiKey.Id, apiKey.Name, apiKey.Key, apiKey.CreatedAt), StatusCodes.Status201Created, ct);
    }
}

public sealed record CreateApiKeyRequest(string? Name);

public sealed record CreateApiKeyResponse(string Id, string Name, string Key, DateTimeOffset CreatedAt);
