using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Admin;

public class CleanupUploadsResponse
{
    public int Cleaned { get; set; }
}

public class CleanupUploadsEndpoint(AppDbContext db, IStorageService storage, ILogger<CleanupUploadsEndpoint> logger) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;
    private readonly IStorageService _storage = storage;
    private readonly ILogger<CleanupUploadsEndpoint> _logger = logger;

  public override void Configure()
    {
        Post("/admin/uploads/cleanup");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var now = DateTime.UtcNow;
        var expiredUploads = await _db.Uploads
            .Include(u => u.User)
            .ThenInclude(u => u!.Settings)
            .Where(u => (u.ExpiresAt != null && u.ExpiresAt <= now) || (u.MaxViews != null && u.ViewCount >= u.MaxViews))
            .ToListAsync(ct);

        var cleanedCount = 0;

        foreach (var upload in expiredUploads)
        {
            try
            {
                await _storage.DeleteAsync(upload.StoragePath, ct);
                if (!string.IsNullOrEmpty(upload.ThumbnailPath))
                {
                    await _storage.DeleteAsync(upload.ThumbnailPath, ct);
                }

                if (upload.User?.Settings != null)
                {
                    upload.User.Settings.StorageUsed = Math.Max(0, upload.User.Settings.StorageUsed - upload.Size);
                }

                _db.Uploads.Remove(upload);
                cleanedCount++;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to cleanup upload {UploadId}", upload.Id);
            }
        }

        if (cleanedCount > 0)
        {
            await _db.SaveChangesAsync(ct);
        }

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new CleanupUploadsResponse
        {
            Cleaned = cleanedCount
        }, (JsonSerializerOptions?)null, ct);
    }
}