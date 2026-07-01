using System.Security.Claims;

namespace TwinkForSale.Api.Infrastructure.Auth;

public static class ClaimsPrincipalExtensions
{
    public static string? GetUserId(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    public static string? GetApiKeyId(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(AppClaimTypes.ApiKeyId);
    }

    public static bool IsApprovedUser(this ClaimsPrincipal principal)
    {
        return principal.HasClaim(AppClaimTypes.IsApproved, "true");
    }

    public static bool IsAdminUser(this ClaimsPrincipal principal)
    {
        return principal.HasClaim(AppClaimTypes.IsAdmin, "true");
    }
}
