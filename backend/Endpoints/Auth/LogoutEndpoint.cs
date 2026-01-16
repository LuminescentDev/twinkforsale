using FastEndpoints;

namespace TwinkForSale.Api.Endpoints.Auth;

public record LogoutResponse(string Message = "Logged out successfully");

public class LogoutEndpoint : EndpointWithoutRequest<LogoutResponse>
{
    public override void Configure()
    {
        Post("/auth/logout");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Cookies.Delete("access_token");
        HttpContext.Response.Cookies.Delete("refresh_token");

        await SendAsync(new LogoutResponse(), cancellation: ct);
    }
}
