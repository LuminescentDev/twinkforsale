using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Admin.Get;

public sealed class AdminHealthEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<AdminHealthResponse>
{
    public override void Configure()
    {
        Get("/admin/health");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var db = await dbContext.Database.CanConnectAsync(ct);
        await SendOkAsync(new AdminHealthResponse(db ? "ok" : "degraded", db, DateTimeOffset.UtcNow), ct);
    }
}

public sealed record AdminHealthResponse(string Status, bool DatabaseReachable, DateTimeOffset CheckedAtUtc);
