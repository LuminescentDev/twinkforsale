using System.Text.Json;
using FastEndpoints;

namespace TwinkForSale.Api.Endpoints.Auth;

public class LogoutResponse
{
    public string Message { get; set; } = "Logged out successfully";
}

public class LogoutEndpoint : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/auth/logout");
        AllowAnonymous();
        Description(x => x.WithTags("Auth"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Cookies.Delete("access_token");
        HttpContext.Response.Cookies.Delete("refresh_token");

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new LogoutResponse(), (JsonSerializerOptions?)null, ct);
    }
}
