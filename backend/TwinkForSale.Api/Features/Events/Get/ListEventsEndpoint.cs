using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Events.Get;

public sealed class ListEventsEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ListEventsResponse>
{
    public override void Configure()
    {
        Get("/api/admin/events", "/admin/events");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var events = await dbContext.SystemEvents.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(250)
            .Select(x => new EventDto(x.Id, x.Type, x.Severity, x.Title, x.Message, x.Metadata, x.UserId, x.CreatedAt))
            .ToListAsync(ct);
        await SendOkAsync(new ListEventsResponse(events), ct);
    }
}

public sealed record ListEventsResponse(IReadOnlyList<EventDto> Events);
public sealed record EventDto(string Id, string Type, string Severity, string Title, string Message, string? Metadata, string? UserId, DateTimeOffset CreatedAt);
