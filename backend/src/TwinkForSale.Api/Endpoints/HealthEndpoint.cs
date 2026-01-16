using FastEndpoints;

namespace TwinkForSale.Api.Endpoints;

public class HealthEndpoint : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/health");
        AllowAnonymous();
        Description(x => x.WithTags("Health"));
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        return SendOkAsync(new { status = "healthy", timestamp = DateTime.UtcNow }, ct);
    }
}
