using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.SystemHealth.Get;

public sealed class HealthEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<HealthResponse>
{
    public override void Configure()
    {
        Get("/api/health");
        AllowAnonymous();
        Summary(summary =>
        {
            summary.Summary = "Checks backend health.";
            summary.Description = "Returns API status and whether the configured database can be reached.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var databaseReachable = await dbContext.Database.CanConnectAsync(ct);

        await SendOkAsync(new HealthResponse(
            Status: databaseReachable ? "ok" : "degraded",
            DatabaseReachable: databaseReachable,
            CheckedAtUtc: DateTimeOffset.UtcNow), ct);
    }
}

public sealed record HealthResponse(
    string Status,
    bool DatabaseReachable,
    DateTimeOffset CheckedAtUtc);
