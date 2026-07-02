using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Auth.Post;

public sealed class LogoutEndpoint(AppDbContext dbContext) : EndpointWithoutRequest
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

        HttpContext.Response.Cookies.Delete(BrowserSessionDefaults.SessionCookieName, new CookieOptions { Path = "/" });
        await SendNoContentAsync(ct);
    }
}
