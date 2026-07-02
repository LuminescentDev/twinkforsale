using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Auth.Post;

public sealed class LogoutEndpoint(AppDbContext dbContext, IOptions<AppOptions> appOptions) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/auth/logout");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var sessionToken = HttpContext.Request.Cookies[BrowserSessionDefaults.SessionCookieName];
        if (!string.IsNullOrWhiteSpace(sessionToken))
        {
            await dbContext.Sessions
                .Where(x => x.SessionToken == sessionToken)
                .ExecuteDeleteAsync(ct);
        }

        HttpContext.Response.Cookies.Delete(BrowserSessionDefaults.SessionCookieName, new CookieOptions
        {
            Path = "/",
            Domain = string.IsNullOrWhiteSpace(appOptions.Value.CookieDomain) ? null : appOptions.Value.CookieDomain
        });
        await SendNoContentAsync(ct);
    }
}
