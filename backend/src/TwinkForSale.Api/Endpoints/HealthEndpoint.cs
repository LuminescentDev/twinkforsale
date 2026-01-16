using System.Text.Json;
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

  public override async Task HandleAsync(CancellationToken ct)
  {
    var response = new { status = "healthy", timestamp = DateTime.UtcNow };
    HttpContext.Response.ContentType = "application/json";
    await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
  }
}
