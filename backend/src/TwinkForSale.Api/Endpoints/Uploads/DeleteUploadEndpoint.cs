using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Uploads;

public class DeleteUploadRequest
{
    public string Id { get; set; } = null!;
}

public class DeleteUploadEndpoint(
    AppDbContext db,
    IStorageService storage,
    ILogger<DeleteUploadEndpoint> logger) : Endpoint<DeleteUploadRequest>
{
    private readonly AppDbContext _db = db;
    private readonly IStorageService _storage = storage;
    private readonly ILogger<DeleteUploadEndpoint> _logger = logger;

  public override void Configure()
    {
        Delete("/uploads/{Id}");
        AuthSchemes("JWT", "ApiKey");
        Description(x => x.WithTags("Uploads"));
    }

    public override async Task HandleAsync(DeleteUploadRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var upload = await _db.Uploads
            .Include(u => u.User)
            .ThenInclude(u => u!.Settings)
            .FirstOrDefaultAsync(u => u.Id == req.Id, ct);

        if (upload == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        // Check ownership (unless admin)
        var isAdmin = User.FindFirstValue("IsAdmin") == "true";
        if (upload.UserId != userId && !isAdmin)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        // Delete from storage
        await _storage.DeleteAsync(upload.StoragePath, ct);
        if (!string.IsNullOrEmpty(upload.ThumbnailPath))
        {
            await _storage.DeleteAsync(upload.ThumbnailPath, ct);
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

        _db.Uploads.Remove(upload);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Upload deleted: {UploadId} by user {UserId}", req.Id, userId);

        HttpContext.Response.StatusCode = 204;
    }
}
