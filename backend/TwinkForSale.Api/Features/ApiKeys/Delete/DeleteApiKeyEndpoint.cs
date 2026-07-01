using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ApiKeys.Delete;

public sealed class DeleteApiKeyEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<DeleteApiKeyResponse>
{
    public override void Configure()
    {
        Delete("/api/api-keys/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var currentApiKeyId = User.GetApiKeyId();
        if (id == currentApiKeyId)
        {
            await SendAsync(new DeleteApiKeyResponse(false, "Cannot delete the API key currently being used."), StatusCodes.Status400BadRequest, ct);
            return;
        }

        var apiKey = await dbContext.ApiKeys.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId && x.IsActive, ct);
        if (apiKey is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        apiKey.IsActive = false;
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(new DeleteApiKeyResponse(true), ct);
    }
}

public sealed record DeleteApiKeyResponse(bool Success, string? Error = null);
