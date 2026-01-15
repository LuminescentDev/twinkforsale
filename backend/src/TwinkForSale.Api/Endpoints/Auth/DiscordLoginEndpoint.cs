using FastEndpoints;
using TwinkForSale.Api.Services.Auth;

namespace TwinkForSale.Api.Endpoints.Auth;

public class DiscordLoginEndpoint : EndpointWithoutRequest
{
    private readonly IDiscordOAuthService _discord;

    public DiscordLoginEndpoint(IDiscordOAuthService discord)
    {
        _discord = discord;
    }

    public override void Configure()
    {
        Get("/auth/discord");
        AllowAnonymous();
        Description(x => x.WithTags("Auth"));
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        var state = Guid.NewGuid().ToString("N");

        // Store state in cookie for CSRF protection
        HttpContext.Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(10)
        });

        var url = _discord.GetAuthorizationUrl(state);
        HttpContext.Response.Redirect(url);
        return Task.CompletedTask;
    }
}
