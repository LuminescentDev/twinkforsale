using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FastEndpoints;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Auth.Get;

public sealed class DiscordCallbackEndpoint(
    AppDbContext dbContext,
    IHttpClientFactory httpClientFactory,
    IOptions<DiscordOptions> discordOptions,
    IOptions<AppOptions> appOptions) : EndpointWithoutRequest
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public override void Configure()
    {
        Get("/auth/discord/callback");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var error = HttpContext.Request.Query["error"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(error))
        {
            await RedirectToFrontendAsync($"/?authError={Uri.EscapeDataString(error)}", null, ct);
            return;
        }

        var code = HttpContext.Request.Query["code"].FirstOrDefault();
        var state = ReadState(HttpContext.Request.Query["state"].FirstOrDefault());
        var expectedNonce = HttpContext.Request.Cookies[BrowserSessionDefaults.OAuthStateCookieName];
        HttpContext.Response.Cookies.Delete(BrowserSessionDefaults.OAuthStateCookieName, new CookieOptions { Path = "/" });

        if (string.IsNullOrWhiteSpace(code) || state is null || string.IsNullOrWhiteSpace(expectedNonce) || state.Nonce != expectedNonce)
        {
            await RedirectToFrontendAsync("/?authError=invalid_oauth_state", null, ct);
            return;
        }

        var token = await ExchangeCodeAsync(code, DiscordLoginEndpoint.BuildCallbackUrl(HttpContext.Request, appOptions.Value.BaseUrl), ct);
        if (token is null || string.IsNullOrWhiteSpace(token.AccessToken))
        {
            await RedirectToFrontendAsync("/?authError=discord_token_failed", state.FrontendOrigin, ct);
            return;
        }

        var discordUser = await FetchDiscordUserAsync(token.AccessToken, ct);
        if (discordUser is null)
        {
            await RedirectToFrontendAsync("/?authError=discord_user_failed", state.FrontendOrigin, ct);
            return;
        }

        var user = await UpsertUserAsync(discordUser, token, ct);
        var sessionToken = CreateSessionToken();
        dbContext.Sessions.Add(new Session
        {
            UserId = user.Id,
            SessionToken = sessionToken,
            Expires = DateTimeOffset.UtcNow.AddDays(BrowserSessionDefaults.SessionDays)
        });

        await dbContext.SaveChangesAsync(ct);

        HttpContext.Response.Cookies.Append(BrowserSessionDefaults.SessionCookieName, sessionToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = HttpContext.Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(BrowserSessionDefaults.SessionDays)
        });

        await RedirectToFrontendAsync(state.ReturnTo, state.FrontendOrigin, ct);
    }

    private async Task<DiscordTokenResponse?> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct)
    {
        var options = discordOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ClientId) || string.IsNullOrWhiteSpace(options.ClientSecret))
        {
            return null;
        }

        using var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, "https://discord.com/api/oauth2/token")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = options.ClientId,
                ["client_secret"] = options.ClientSecret,
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = redirectUri
            })
        };

        var response = await httpClientFactory.CreateClient().SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) return null;

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        return await JsonSerializer.DeserializeAsync<DiscordTokenResponse>(stream, JsonOptions, ct);
    }

    private async Task<DiscordUserResponse?> FetchDiscordUserAsync(string accessToken, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(System.Net.Http.HttpMethod.Get, "https://discord.com/api/users/@me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await httpClientFactory.CreateClient().SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) return null;

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        return await JsonSerializer.DeserializeAsync<DiscordUserResponse>(stream, JsonOptions, ct);
    }

    private async Task<User> UpsertUserAsync(DiscordUserResponse discordUser, DiscordTokenResponse token, CancellationToken ct)
    {
        var account = await dbContext.Accounts
            .Include(x => x.User)
            .ThenInclude(x => x!.Settings)
            .FirstOrDefaultAsync(x => x.Provider == "discord" && x.ProviderAccountId == discordUser.Id, ct);

        var email = string.IsNullOrWhiteSpace(discordUser.Email)
            ? $"{discordUser.Id}@discord.local"
            : discordUser.Email;

        var avatar = string.IsNullOrWhiteSpace(discordUser.Avatar)
            ? null
            : $"https://cdn.discordapp.com/avatars/{discordUser.Id}/{discordUser.Avatar}.png?size=256";

        User user;
        if (account?.User is not null)
        {
            user = account.User;
        }
        else
        {
            user = await dbContext.Users.Include(x => x.Settings).FirstOrDefaultAsync(x => x.Email == email, ct)
                ?? new User { Email = email, CreatedAt = DateTimeOffset.UtcNow };

            if (dbContext.Entry(user).State == EntityState.Detached)
            {
                dbContext.Users.Add(user);
            }

            account = new Account
            {
                User = user,
                Provider = "discord",
                Type = "oauth",
                ProviderAccountId = discordUser.Id
            };
            dbContext.Accounts.Add(account);
        }

        user.Name = discordUser.GlobalName ?? discordUser.Username ?? user.Name;
        user.Email = email;
        user.Image = avatar;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        user.Settings ??= await dbContext.UserSettings.FirstOrDefaultAsync(x => x.UserId == user.Id, ct);

        if (user.Settings is null)
        {
            user.Settings = new UserSettings
            {
                User = user,
                UserId = user.Id,
                BioDiscordUserId = discordUser.Id
            };
            dbContext.UserSettings.Add(user.Settings);
        }
        else if (string.IsNullOrWhiteSpace(user.Settings.BioDiscordUserId))
        {
            user.Settings.BioDiscordUserId = discordUser.Id;
        }

        account.AccessToken = token.AccessToken;
        account.RefreshToken = token.RefreshToken;
        account.ExpiresAt = token.ExpiresIn is null ? null : (int)DateTimeOffset.UtcNow.AddSeconds(token.ExpiresIn.Value).ToUnixTimeSeconds();
        account.TokenType = token.TokenType;
        account.Scope = token.Scope;

        return user;
    }

    private async Task RedirectToFrontendAsync(string returnTo, string? frontendOrigin, CancellationToken ct)
    {
        var frontendUrl = (frontendOrigin ?? appOptions.Value.FrontendUrl).TrimEnd('/');
        var safeReturnTo = DiscordLoginEndpoint.SanitizeReturnTo(returnTo);
        await SendRedirectAsync(
            string.IsNullOrWhiteSpace(frontendUrl) ? safeReturnTo : $"{frontendUrl}{safeReturnTo}",
            isPermanent: false,
            allowRemoteRedirects: true);
    }

    private static DiscordLoginEndpoint.OAuthState? ReadState(string? state)
    {
        if (string.IsNullOrWhiteSpace(state)) return null;
        try
        {
            var json = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(state));
            return JsonSerializer.Deserialize<DiscordLoginEndpoint.OAuthState>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private static string CreateSessionToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    private sealed record DiscordTokenResponse(
        [property: JsonPropertyName("access_token")] string? AccessToken,
        [property: JsonPropertyName("token_type")] string? TokenType,
        [property: JsonPropertyName("expires_in")] int? ExpiresIn,
        [property: JsonPropertyName("refresh_token")] string? RefreshToken,
        [property: JsonPropertyName("scope")] string? Scope);

    private sealed record DiscordUserResponse(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("username")] string? Username,
        [property: JsonPropertyName("global_name")] string? GlobalName,
        [property: JsonPropertyName("email")] string? Email,
        [property: JsonPropertyName("avatar")] string? Avatar);
}
