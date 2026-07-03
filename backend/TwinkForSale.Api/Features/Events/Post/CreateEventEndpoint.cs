using FastEndpoints;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Events.Post;

public sealed class CreateEventEndpoint(AppDbContext dbContext) : Endpoint<CreateEventRequest, CreateEventResponse>
{
    public override void Configure()
    {
        Post("/api/admin/events");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CreateEventRequest req, CancellationToken ct)
    {
        var evt = new SystemEvent
        {
            Type = req.Type,
            Severity = req.Severity,
            Title = req.Title,
            Message = req.Message,
            Metadata = req.Metadata,
            UserId = req.UserId
        };
        dbContext.SystemEvents.Add(evt);
        await dbContext.SaveChangesAsync(ct);
        await SendAsync(new CreateEventResponse(true, evt.Id), StatusCodes.Status201Created, ct);
    }
}

public sealed record CreateEventRequest(string Type, string Severity, string Title, string Message, string? Metadata, string? UserId);
public sealed record CreateEventResponse(bool Success, string Id);
