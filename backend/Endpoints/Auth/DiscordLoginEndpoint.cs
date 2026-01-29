using FastEndpoints;
using TwinkForSale.Api.Services.Auth;

namespace TwinkForSale.Api.Endpoints.Auth;

public class DiscordLoginEndpoint(IDiscordOAuthService discord) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/auth/discord");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var state = Guid.NewGuid().ToString("N");

        HttpContext.Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            MaxAge = TimeSpan.FromMinutes(10)
        });

        var url = discord.GetAuthorizationUrl(state);
        await SendRedirectAsync(url, allowRemoteRedirects: true);
    }
}
