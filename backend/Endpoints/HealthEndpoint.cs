using System.Text.Json;
using FastEndpoints;

namespace TwinkForSale.Api.Endpoints;

public record HealthResponse(string Status, DateTime Timestamp);

public class GetHealth : EndpointWithoutRequest<HealthResponse>
{
    public override void Configure()
    {
        Get("/health");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var response = new HealthResponse("healthy", DateTime.UtcNow);
        await SendOkAsync(response, ct);
    }
}
