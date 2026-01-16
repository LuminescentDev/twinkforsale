using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Users;

public record DeleteAccountRequest(string ConfirmationText);

public class DeleteAccountEndpoint(
    AppDbContext db,
    IStorageService storage,
    ILogger<DeleteAccountEndpoint> logger) : Endpoint<DeleteAccountRequest>
{
    public override void Configure()
    {
        Delete("/users/me");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(DeleteAccountRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        // Verify confirmation text
        if (req.ConfirmationText != "DELETE MY ACCOUNT")
        {
            AddError("Please type 'DELETE MY ACCOUNT' to confirm deletion");
            await SendErrorsAsync(400, ct);
            return;
        }

        var user = await db.Users
            .Include(u => u.Uploads)
            .Include(u => u.Settings)
            .Include(u => u.ApiKeys)
            .Include(u => u.ShortLinks)
            .Include(u => u.BioLinks)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        logger.LogInformation("Starting account deletion for user {UserId} ({Email})", userId, user.Email);

        // Delete all user files from storage
        foreach (var upload in user.Uploads)
        {
            try
            {
                await storage.DeleteAsync(upload.StoragePath, ct);
                if (!string.IsNullOrEmpty(upload.ThumbnailPath))
                {
                    await storage.DeleteAsync(upload.ThumbnailPath, ct);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to delete file {StoragePath} for user {UserId}",
                    upload.StoragePath, userId);
            }
        }

        // Delete user (cascade will handle related data)
        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Account deleted: {UserId} ({Email})", userId, user.Email);

        // Clear auth cookies
        HttpContext.Response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
        HttpContext.Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });

        await SendNoContentAsync(ct);
    }
}
