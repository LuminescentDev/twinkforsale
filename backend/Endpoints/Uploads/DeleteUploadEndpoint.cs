using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Uploads;

public record DeleteUploadRequest(string Id);

public class DeleteUploadEndpoint(
    AppDbContext db,
    IStorageService storage,
    ILogger<DeleteUploadEndpoint> logger) : Endpoint<DeleteUploadRequest>
{
    public override void Configure()
    {
        Delete("/uploads/{Id}");
        AuthSchemes("JWT", "ApiKey");
    }

    public override async Task HandleAsync(DeleteUploadRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var upload = await db.Uploads
            .Include(u => u.User)
            .ThenInclude(u => u!.Settings)
            .FirstOrDefaultAsync(u => u.Id == req.Id, ct);

        if (upload == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        // Check ownership (unless admin)
        var isAdmin = User.FindFirstValue("IsAdmin") == "true";
        if (upload.UserId != userId && !isAdmin)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        // Delete from storage
        await storage.DeleteAsync(upload.StoragePath, ct);
        if (!string.IsNullOrEmpty(upload.ThumbnailPath))
        {
            await storage.DeleteAsync(upload.ThumbnailPath, ct);
        }

        // Update storage used
        if (upload.User?.Settings != null)
        {
            upload.User.Settings.StorageUsed -= upload.Size;
            if (upload.User.Settings.StorageUsed < 0)
            {
                upload.User.Settings.StorageUsed = 0;
            }
        }

        db.Uploads.Remove(upload);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Upload deleted: {UploadId} by user {UserId}", req.Id, userId);

        await SendNoContentAsync(ct);
    }
}
