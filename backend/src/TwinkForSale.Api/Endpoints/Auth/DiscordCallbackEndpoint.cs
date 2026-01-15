using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Auth;
using UserEntity = TwinkForSale.Api.Entities.User;
using AccountEntity = TwinkForSale.Api.Entities.Account;
using UserSettingsEntity = TwinkForSale.Api.Entities.UserSettings;

namespace TwinkForSale.Api.Endpoints.Auth;

public class DiscordCallbackRequest
{
    public string Code { get; set; } = null!;
    public string State { get; set; } = null!;
}

public class DiscordCallbackEndpoint : Endpoint<DiscordCallbackRequest>
{
    private readonly IDiscordOAuthService _discord;
    private readonly IJwtService _jwt;
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<DiscordCallbackEndpoint> _logger;

    public DiscordCallbackEndpoint(
        IDiscordOAuthService discord,
        IJwtService jwt,
        AppDbContext db,
        IConfiguration config,
        ILogger<DiscordCallbackEndpoint> logger)
    {
        _discord = discord;
        _jwt = jwt;
        _db = db;
        _config = config;
        _logger = logger;
    }

    public override void Configure()
    {
        Get("/auth/callback");
        AllowAnonymous();
        Description(x => x.WithTags("Auth"));
    }

    public override async Task HandleAsync(DiscordCallbackRequest req, CancellationToken ct)
    {
        var frontendUrl = _config["Cors:Origins"]?.Split(',').First() ?? "http://localhost:3000";

        // Verify state for CSRF protection
        var storedState = HttpContext.Request.Cookies["oauth_state"];
        if (string.IsNullOrEmpty(storedState) || storedState != req.State)
        {
            _logger.LogWarning("OAuth state mismatch");
            HttpContext.Response.Redirect($"{frontendUrl}?error=invalid_state");
            return;
        }

        // Clear the state cookie
        HttpContext.Response.Cookies.Delete("oauth_state");

        // Exchange code for tokens
        var tokens = await _discord.ExchangeCodeAsync(req.Code);
        if (tokens == null)
        {
            _logger.LogError("Failed to exchange Discord code");
            HttpContext.Response.Redirect($"{frontendUrl}?error=token_exchange_failed");
            return;
        }

        // Get Discord user info
        var discordUser = await _discord.GetUserAsync(tokens.AccessToken);
        if (discordUser == null || string.IsNullOrEmpty(discordUser.Email))
        {
            _logger.LogError("Failed to get Discord user or email not provided");
            HttpContext.Response.Redirect($"{frontendUrl}?error=user_fetch_failed");
            return;
        }

        // Find or create user
        var user = await _db.Users
            .Include(u => u.Accounts)
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Email == discordUser.Email, ct);

        var isNewUser = user == null;

        if (user == null)
        {
            user = new UserEntity
            {
                Email = discordUser.Email,
                Name = discordUser.GlobalName ?? discordUser.Username,
                Image = discordUser.GetAvatarUrl(),
                IsApproved = false,
                IsAdmin = false
            };
            _db.Users.Add(user);

            // Create default settings
            var settings = new UserSettingsEntity { UserId = user.Id };
            _db.UserSettings.Add(settings);
        }

        // Update or create Discord account link
        var existingAccount = user.Accounts.FirstOrDefault(a => a.Provider == "discord");
        if (existingAccount != null)
        {
            existingAccount.AccessToken = tokens.AccessToken;
            existingAccount.RefreshToken = tokens.RefreshToken;
            existingAccount.ExpiresAt = (int)(DateTime.UtcNow.AddSeconds(tokens.ExpiresIn) - DateTime.UnixEpoch).TotalSeconds;
        }
        else
        {
            var account = new AccountEntity
            {
                UserId = user.Id,
                Type = "oauth",
                Provider = "discord",
                ProviderAccountId = discordUser.Id,
                AccessToken = tokens.AccessToken,
                RefreshToken = tokens.RefreshToken,
                ExpiresAt = (int)(DateTime.UtcNow.AddSeconds(tokens.ExpiresIn) - DateTime.UnixEpoch).TotalSeconds,
                TokenType = tokens.TokenType,
                Scope = tokens.Scope
            };
            _db.Accounts.Add(account);
        }

        // Update user info from Discord
        user.Name = discordUser.GlobalName ?? discordUser.Username;
        user.Image = discordUser.GetAvatarUrl();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("User authenticated via Discord: {UserId}, New: {IsNew}", user.Id, isNewUser);

        // Generate JWT tokens
        var accessToken = _jwt.GenerateAccessToken(user);
        var refreshToken = _jwt.GenerateRefreshToken();

        // Set tokens in HttpOnly cookies
        HttpContext.Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(int.Parse(_config["Jwt:ExpiryMinutes"] ?? "15"))
        });

        HttpContext.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(int.Parse(_config["Jwt:RefreshExpiryDays"] ?? "7"))
        });

        // Redirect to frontend
        HttpContext.Response.Redirect($"{frontendUrl}/dashboard");
    }
}
