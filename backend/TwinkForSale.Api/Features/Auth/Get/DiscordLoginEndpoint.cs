using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FastEndpoints;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;

namespace TwinkForSale.Api.Features.Auth.Get;

public sealed class DiscordLoginEndpoint(
    IOptions<DiscordOptions> discordOptions,
    IOptions<AppOptions> appOptions) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/auth/discord/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var options = discordOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ClientId))
        {
            HttpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await HttpContext.Response.WriteAsync("Discord OAuth is not configured.", ct);
            return;
        }

        var nonce = GenerateToken();
        var returnTo = SanitizeReturnTo(HttpContext.Request.Query["returnTo"].FirstOrDefault());
        var frontendOrigin = GetFrontendOrigin(HttpContext.Request, appOptions.Value.FrontendUrl);
        var state = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new OAuthState(nonce, returnTo, frontendOrigin))));

        HttpContext.Response.Cookies.Append(BrowserSessionDefaults.OAuthStateCookieName, nonce, CookieOptions());

        var callbackUrl = BuildCallbackUrl(HttpContext.Request, appOptions.Value.BaseUrl);
        var parameters = new Dictionary<string, string?>
        {
            ["client_id"] = options.ClientId,
            ["redirect_uri"] = callbackUrl,
            ["response_type"] = "code",
            ["scope"] = "identify email guilds.join",
            ["state"] = state
        };

        await SendRedirectAsync(
            QueryHelpers.AddQueryString("https://discord.com/api/oauth2/authorize", parameters),
            isPermanent: false,
            allowRemoteRedirects: true);
    }

    internal static string BuildCallbackUrl(HttpRequest request, string configuredBaseUrl)
    {
        var pathBase = GetExternalPathBase(request, configuredBaseUrl);
        return $"{request.Scheme}://{request.Host}{pathBase}/auth/discord/callback";
    }

    private static string GetExternalPathBase(HttpRequest request, string configuredBaseUrl)
    {
        var forwardedPrefix = request.Headers["X-Forwarded-Prefix"].FirstOrDefault()
            ?? request.Headers["X-Forwarded-PathBase"].FirstOrDefault();

        if (TryNormalizePathBase(forwardedPrefix, out var normalizedForwardedPrefix))
        {
            return normalizedForwardedPrefix;
        }

        if (request.PathBase.HasValue)
        {
            return request.PathBase.Value?.TrimEnd('/') ?? string.Empty;
        }

        if (Uri.TryCreate(configuredBaseUrl, UriKind.Absolute, out var configuredUri) &&
            TryNormalizePathBase(configuredUri.AbsolutePath, out var normalizedConfiguredPath))
        {
            return normalizedConfiguredPath;
        }

        return string.Empty;
    }

    private static bool TryNormalizePathBase(string? value, out string normalized)
    {
        normalized = string.Empty;

        if (string.IsNullOrWhiteSpace(value) || value == "/")
        {
            return false;
        }

        if (!value.StartsWith("/", StringComparison.Ordinal) ||
            value.Contains("://", StringComparison.Ordinal) ||
            value.Contains("?", StringComparison.Ordinal) ||
            value.Contains("#", StringComparison.Ordinal))
        {
            return false;
        }

        normalized = value.TrimEnd('/');
        return normalized.Length > 0;
    }

    internal static string SanitizeReturnTo(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return "/";

        if (Uri.TryCreate(value, UriKind.Relative, out var relative) && !value.StartsWith("//", StringComparison.Ordinal))
        {
            return relative.ToString();
        }

        return "/";
    }

    internal static string? GetFrontendOrigin(HttpRequest request, string configuredFrontendUrl)
    {
        var candidate = request.Headers.Origin.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(candidate))
        {
            var referer = request.Headers.Referer.FirstOrDefault();
            if (Uri.TryCreate(referer, UriKind.Absolute, out var refererUri))
            {
                candidate = refererUri.GetLeftPart(UriPartial.Authority);
            }
        }

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var origin))
        {
            return null;
        }

        if (IsLocalDevOrigin(origin))
        {
            return origin.GetLeftPart(UriPartial.Authority);
        }

        if (Uri.TryCreate(configuredFrontendUrl, UriKind.Absolute, out var configured) &&
            Uri.Compare(origin, configured, UriComponents.SchemeAndServer, UriFormat.Unescaped, StringComparison.OrdinalIgnoreCase) == 0)
        {
            return origin.GetLeftPart(UriPartial.Authority);
        }

        return null;
    }

    private static bool IsLocalDevOrigin(Uri origin)
    {
        return origin.Scheme is "http" or "https" &&
            (origin.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
             origin.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
             origin.Host.Equals("::1", StringComparison.OrdinalIgnoreCase));
    }

    internal static CookieOptions CookieOptions() => new()
    {
        HttpOnly = true,
        Secure = false,
        SameSite = SameSiteMode.Lax,
        Path = "/",
        MaxAge = TimeSpan.FromMinutes(10)
    };

    private static string GenerateToken()
    {
        Span<byte> bytes = stackalloc byte[32];
        RandomNumberGenerator.Fill(bytes);
        return WebEncoders.Base64UrlEncode(bytes);
    }

    internal sealed record OAuthState(string Nonce, string ReturnTo, string? FrontendOrigin = null);
}
