using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Events.Delete;

public sealed class DeleteEventEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<DeleteEventResponse>
{
    public override void Configure()
    {
        Delete("/api/admin/events/{id}", "/admin/events/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id");
        var evt = await dbContext.SystemEvents.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (evt is null) { await SendNotFoundAsync(ct); return; }
        dbContext.SystemEvents.Remove(evt);
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new DeleteEventResponse(true), ct);
    }
}

public sealed record DeleteEventResponse(bool Success);
