using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;

namespace TwinkForSale.Api.Features.Uploads;

public sealed class UploadAccess(IDataProtectionProvider protection)
{
    private readonly IDataProtector protector = protection.CreateProtector("upload-password-v1");
    private readonly PasswordHasher<Upload> hasher = new();

    public string Hash(Upload upload, string password) => hasher.HashPassword(upload, password);
    public bool Verify(Upload upload, string password) => upload.PasswordHash is not null &&
        hasher.VerifyHashedPassword(upload, upload.PasswordHash, password) != PasswordVerificationResult.Failed;

    public bool CanRead(Upload upload, HttpContext context)
    {
        if (upload.UserId is not null && context.User.GetUserId() == upload.UserId) return true;
        if (upload.AccessMode == "public") return true;
        if (upload.AccessMode == "members") return context.User.HasClaim(AppClaimTypes.IsApproved, "true");
        var ticket = context.Request.Cookies[$"upload_{upload.Id}"];
        if (ticket is null) return false;
        try
        {
            var value = protector.Unprotect(ticket).Split('\n');
            return value.Length == 3 && value[0] == upload.Id && value[1] == upload.PasswordHash &&
                long.TryParse(value[2], out var expiry) && expiry > DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        }
        catch (System.Security.Cryptography.CryptographicException) { return false; }
    }

    public void Grant(Upload upload, HttpContext context)
    {
        var expires = DateTimeOffset.UtcNow.AddHours(12);
        var ticket = protector.Protect($"{upload.Id}\n{upload.PasswordHash}\n{expires.ToUnixTimeSeconds()}");
        context.Response.Cookies.Append($"upload_{upload.Id}", ticket, new CookieOptions
        {
            HttpOnly = true, Secure = context.Request.IsHttps, SameSite = SameSiteMode.Lax,
            Path = $"/f/{upload.ShortCode}", Expires = expires, IsEssential = true
        });
    }

    public static bool IsAvailable(Upload upload) => upload.DeletedAt is null && !upload.IsPending && !upload.IsRevoked &&
        (upload.ExpiresAt is null || upload.ExpiresAt > DateTimeOffset.UtcNow) &&
        (upload.MaxViews is null || upload.Views < upload.MaxViews);
}
