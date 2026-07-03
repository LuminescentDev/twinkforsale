using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Infrastructure.Auth;

public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    AppDbContext dbContext)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var apiKey = ExtractBearerToken(Request.Headers.Authorization);
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            return await AuthenticateApiKeyAsync(apiKey);
        }

        var sessionToken = Request.Cookies[BrowserSessionDefaults.SessionCookieName];
        if (!string.IsNullOrWhiteSpace(sessionToken))
        {
            return await AuthenticateSessionAsync(sessionToken);
        }

        return AuthenticateResult.NoResult();
    }

    private async Task<AuthenticateResult> AuthenticateApiKeyAsync(string apiKey)
    {
        var keyRecord = await dbContext.ApiKeys
            .AsNoTracking()
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Key == apiKey && x.IsActive, Context.RequestAborted);

        if (keyRecord?.User is null)
        {
            return AuthenticateResult.Fail("Invalid or inactive API key.");
        }

        return CreateTicket(keyRecord.User, keyRecord.Id);
    }

    private async Task<AuthenticateResult> AuthenticateSessionAsync(string sessionToken)
    {
        var session = await dbContext.Sessions
            .AsNoTracking()
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.SessionToken == sessionToken, Context.RequestAborted);

        if (session?.User is null)
        {
            return AuthenticateResult.Fail("Invalid session.");
        }

        if (session.Expires <= DateTimeOffset.UtcNow)
        {
            return AuthenticateResult.Fail("Expired session.");
        }

        return CreateTicket(session.User, apiKeyId: null);
    }

    private static AuthenticateResult CreateTicket(User user, string? apiKeyId)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.Name ?? user.Email),
            new(AppClaimTypes.IsApproved, user.IsApproved.ToString().ToLowerInvariant(), ClaimValueTypes.Boolean),
            new(AppClaimTypes.IsAdmin, user.IsAdmin.ToString().ToLowerInvariant(), ClaimValueTypes.Boolean)
        };

        if (!string.IsNullOrWhiteSpace(apiKeyId))
        {
            claims.Add(new Claim(AppClaimTypes.ApiKeyId, apiKeyId));
        }

        if (user.IsAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var identity = new ClaimsIdentity(claims, ApiKeyAuthenticationDefaults.Scheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, ApiKeyAuthenticationDefaults.Scheme);

        return AuthenticateResult.Success(ticket);
    }

    private static string? ExtractBearerToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
        {
            return null;
        }

        const string prefix = "Bearer ";
        return authorizationHeader.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)
            ? authorizationHeader[prefix.Length..].Trim()
            : authorizationHeader.Trim();
    }
}
