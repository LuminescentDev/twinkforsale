using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Users;

public class DeleteAccountRequest
{
    public string ConfirmationText { get; set; } = null!;
}

public class DeleteAccountEndpoint(
    AppDbContext db,
    IStorageService storage,
    ILogger<DeleteAccountEndpoint> logger) : Endpoint<DeleteAccountRequest>
{
    private readonly AppDbContext _db = db;
    private readonly IStorageService _storage = storage;
    private readonly ILogger<DeleteAccountEndpoint> _logger = logger;

  public override void Configure()
    {
        Delete("/users/me");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Users"));
    }

    public override async Task HandleAsync(DeleteAccountRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        // Verify confirmation text
        if (req.ConfirmationText != "DELETE MY ACCOUNT")
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Please type 'DELETE MY ACCOUNT' to confirm deletion", ct);
            return;
        }

        var user = await _db.Users
            .Include(u => u.Uploads)
            .Include(u => u.Settings)
            .Include(u => u.ApiKeys)
            .Include(u => u.ShortLinks)
            .Include(u => u.BioLinks)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            await HttpContext.Response.WriteAsync("User not found", ct);
            return;
        }

        _logger.LogInformation("Starting account deletion for user {UserId} ({Email})", userId, user.Email);

        // Delete all user files from storage
        foreach (var upload in user.Uploads)
        {
            try
            {
                await _storage.DeleteAsync(upload.StoragePath, ct);
                if (!string.IsNullOrEmpty(upload.ThumbnailPath))
                {
                    await _storage.DeleteAsync(upload.ThumbnailPath, ct);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete file {StoragePath} for user {UserId}",
                    upload.StoragePath, userId);
            }
        }

        // Delete user (cascade will handle related data)
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Account deleted: {UserId} ({Email})", userId, user.Email);

        // Clear auth cookies
        HttpContext.Response.Cookies.Delete("access_token", new CookieOptions { Path = "/" });
        HttpContext.Response.Cookies.Delete("refresh_token", new CookieOptions { Path = "/" });

        HttpContext.Response.StatusCode = 204;
    }
}
