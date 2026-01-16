using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Auth;
using UserEntity = TwinkForSale.Api.Entities.User;
using AccountEntity = TwinkForSale.Api.Entities.Account;
using UserSettingsEntity = TwinkForSale.Api.Entities.UserSettings;

namespace TwinkForSale.Api.Endpoints.Auth;

public record DiscordCallbackRequest(string Code, string State);

public class DiscordCallbackEndpoint(
    IDiscordOAuthService discord,
    IJwtService jwt,
    AppDbContext db,
    IConfiguration config,
    ILogger<DiscordCallbackEndpoint> logger) : Endpoint<DiscordCallbackRequest>
{
    public override void Configure()
    {
        Get("/auth/callback");
        AllowAnonymous();
    }

    public override async Task HandleAsync(DiscordCallbackRequest req, CancellationToken ct)
    {
        var frontendUrl = config["Cors:Origins"]?.Split(',').First() ?? "http://localhost:3000";

        var storedState = HttpContext.Request.Cookies["oauth_state"];
        if (string.IsNullOrEmpty(storedState) || storedState != req.State)
        {
            logger.LogWarning("OAuth state mismatch");
            HttpContext.Response.Redirect($"{frontendUrl}?error=invalid_state");
            return;
        }

        HttpContext.Response.Cookies.Delete("oauth_state");

        var tokens = await discord.ExchangeCodeAsync(req.Code);
        if (tokens == null)
        {
            logger.LogError("Failed to exchange Discord code");
            HttpContext.Response.Redirect($"{frontendUrl}?error=token_exchange_failed");
            return;
        }

        var discordUser = await discord.GetUserAsync(tokens.AccessToken);
        if (discordUser == null || string.IsNullOrEmpty(discordUser.Email))
        {
            logger.LogError("Failed to get Discord user or email not provided");
            HttpContext.Response.Redirect($"{frontendUrl}?error=user_fetch_failed");
            return;
        }

        var user = await db.Users
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
            db.Users.Add(user);

            var settings = new UserSettingsEntity { UserId = user.Id };
            db.UserSettings.Add(settings);
        }

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
            db.Accounts.Add(account);
        }

        user.Name = discordUser.GlobalName ?? discordUser.Username;
        user.Image = discordUser.GetAvatarUrl();
        user.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        logger.LogInformation("User authenticated via Discord: {UserId}, New: {IsNew}", user.Id, isNewUser);

        var accessToken = jwt.GenerateAccessToken(user);
        var refreshToken = jwt.GenerateRefreshToken();

        HttpContext.Response.Cookies.Append("access_token", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(int.Parse(config["Jwt:ExpiryMinutes"] ?? "15"))
        });

        HttpContext.Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromDays(int.Parse(config["Jwt:RefreshExpiryDays"] ?? "7"))
        });

        HttpContext.Response.Redirect($"{frontendUrl}/dashboard");
    }
}
