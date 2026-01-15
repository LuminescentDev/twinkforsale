using System.Net.Http.Headers;
using System.Text.Json;

namespace TwinkForSale.Api.Services.Auth;

public interface IDiscordOAuthService
{
    string GetAuthorizationUrl(string state);
    Task<DiscordTokenResponse?> ExchangeCodeAsync(string code);
    Task<DiscordUser?> GetUserAsync(string accessToken);
}

public class DiscordOAuthService(IConfiguration config, HttpClient httpClient, ILogger<DiscordOAuthService> logger) : IDiscordOAuthService
{
    private readonly IConfiguration _config = config;
    private readonly HttpClient _httpClient = httpClient;
    private readonly ILogger<DiscordOAuthService> _logger = logger;

    private const string AuthorizeUrl = "https://discord.com/api/oauth2/authorize";
    private const string TokenUrl = "https://discord.com/api/oauth2/token";
    private const string UserUrl = "https://discord.com/api/users/@me";

  public string GetAuthorizationUrl(string state)
    {
        var clientId = _config["Discord:ClientId"];
        var redirectUri = Uri.EscapeDataString(_config["Discord:RedirectUri"]!);
        var scope = Uri.EscapeDataString("identify email");

        return $"{AuthorizeUrl}?client_id={clientId}&redirect_uri={redirectUri}&response_type=code&scope={scope}&state={state}";
    }

    public async Task<DiscordTokenResponse?> ExchangeCodeAsync(string code)
    {
        try
        {
            var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = _config["Discord:ClientId"]!,
                ["client_secret"] = _config["Discord:ClientSecret"]!,
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = _config["Discord:RedirectUri"]!
            });

            var response = await _httpClient.PostAsync(TokenUrl, content);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Discord token exchange failed: {Response}", json);
                return null;
            }

            return JsonSerializer.Deserialize<DiscordTokenResponse>(json, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exchanging Discord code");
            return null;
        }
    }

    public async Task<DiscordUser?> GetUserAsync(string accessToken)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, UserUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Discord user fetch failed: {Response}", json);
                return null;
            }

            return JsonSerializer.Deserialize<DiscordUser>(json, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Discord user");
            return null;
        }
    }
}

public class DiscordTokenResponse
{
    public string AccessToken { get; set; } = null!;
    public string TokenType { get; set; } = null!;
    public int ExpiresIn { get; set; }
    public string RefreshToken { get; set; } = null!;
    public string Scope { get; set; } = null!;
}

public class DiscordUser
{
    public string Id { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string? GlobalName { get; set; }
    public string? Avatar { get; set; }
    public string? Email { get; set; }
    public bool? Verified { get; set; }

    public string GetAvatarUrl()
    {
        if (string.IsNullOrEmpty(Avatar))
            return $"https://cdn.discordapp.com/embed/avatars/{int.Parse(Id) % 5}.png";

        var ext = Avatar.StartsWith("a_") ? "gif" : "png";
        return $"https://cdn.discordapp.com/avatars/{Id}/{Avatar}.{ext}";
    }
}
