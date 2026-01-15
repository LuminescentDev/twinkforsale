using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Services.Auth;

public class ApiKeyAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly AppDbContext _db;

    public ApiKeyAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        AppDbContext db)
        : base(options, logger, encoder)
    {
        _db = db;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var authHeader))
            return AuthenticateResult.NoResult();

        var authValue = authHeader.ToString();
        if (!authValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        var apiKey = authValue["Bearer ".Length..].Trim();

        var key = await _db.ApiKeys
            .Include(k => k.User)
            .FirstOrDefaultAsync(k => k.Key == apiKey && k.IsActive);

        if (key == null)
            return AuthenticateResult.Fail("Invalid API key");

        if (!key.User.IsApproved)
            return AuthenticateResult.Fail("User account not approved");

        // Check expiration
        if (key.ExpiresAt.HasValue && key.ExpiresAt < DateTime.UtcNow)
            return AuthenticateResult.Fail("API key has expired");

        // Update last used
        key.LastUsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, key.User.Id),
            new(ClaimTypes.Email, key.User.Email),
            new(ClaimTypes.Name, key.User.Name ?? key.User.Email),
            new("apiKeyId", key.Id),
            new("isApproved", key.User.IsApproved.ToString()),
            new("isAdmin", key.User.IsAdmin.ToString())
        };

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}
