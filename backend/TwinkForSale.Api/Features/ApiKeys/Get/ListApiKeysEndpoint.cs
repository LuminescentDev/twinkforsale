using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ApiKeys.Get;

public sealed class ListApiKeysEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ListApiKeysResponse>
{
    public override void Configure()
    {
        Get("/api/api-keys");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var keys = await dbContext.ApiKeys
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ApiKeyListItem(x.Id, x.Name, MaskKey(x.Key), x.CreatedAt, x.LastUsed))
            .ToListAsync(ct);

        await SendOkAsync(new ListApiKeysResponse(keys), ct);
    }

    private static string MaskKey(string key)
    {
        return key.Length <= 8 ? "********" : $"{key[..4]}...{key[^4..]}";
    }
}

public sealed record ListApiKeysResponse(IReadOnlyList<ApiKeyListItem> ApiKeys);

public sealed record ApiKeyListItem(string Id, string Name, string MaskedKey, DateTimeOffset CreatedAt, DateTimeOffset? LastUsed);
