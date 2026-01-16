using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services;
using TwinkForSale.Api.Services.Image;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Upload;

public record UploadResponse(string Url, string DeleteUrl, string? ThumbnailUrl);

public class UploadFileEndpoint(
    AppDbContext db,
    IStorageService storage,
    IImageService imageService,
    IShortCodeService shortCodeService,
    IConfiguration config,
    ILogger<UploadFileEndpoint> logger) : EndpointWithoutRequest<UploadResponse>
{
    public override void Configure()
    {
        Post("/upload");
        AuthSchemes("ApiKey");
        AllowFileUploads();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        // Get user with settings
        var user = await db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null || !user.IsApproved)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        var file = Files.FirstOrDefault();
        if (file == null)
        {
            await SendAsync(new UploadResponse("", "", null), 400, ct);
            return;
        }

        var settings = user.Settings;
        if (settings == null)
        {
            await SendAsync(new UploadResponse("", "", null), 500, ct);
            return;
        }

        // Check file size limit
        if (file.Length > settings.MaxFileSize)
        {
            await SendAsync(new UploadResponse("", "", null), 413, ct);
            return;
        }

        // Check storage limit
        if (settings.MaxStorageLimit.HasValue && settings.StorageUsed + file.Length > settings.MaxStorageLimit.Value)
        {
            await SendAsync(new UploadResponse("", "", null), 413, ct);
            return;
        }

        // Generate unique short code
        string shortCode;
        if (settings.UseCustomWords && !string.IsNullOrEmpty(settings.CustomWords))
        {
            var words = settings.CustomWords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            shortCode = shortCodeService.GenerateFromWords(words);
        }
        else
        {
            shortCode = shortCodeService.Generate();
        }

        // Ensure short code is unique
        while (await db.Uploads.AnyAsync(u => u.ShortCode == shortCode, ct))
        {
            shortCode = shortCodeService.Generate();
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{shortCode}{extension}";
        var contentType = file.ContentType ?? "application/octet-stream";

        // Save file to storage
        await using var stream = file.OpenReadStream();
        var storagePath = await storage.SaveAsync(stream, fileName, contentType, ct);

        // Get image dimensions if applicable
        int? width = null;
        int? height = null;
        string? thumbnailPath = null;

        if (imageService.IsImage(contentType))
        {
            stream.Position = 0;
            var dimensions = await imageService.GetDimensionsAsync(stream, ct);
            if (dimensions != null)
            {
                width = dimensions.Width;
                height = dimensions.Height;
            }

            // Generate thumbnail for images
            stream.Position = 0;
            using var thumbStream = await imageService.GenerateThumbnailAsync(stream, 200, 200, ct);
            thumbnailPath = await storage.SaveAsync(thumbStream, $"thumb_{fileName}", "image/jpeg", ct);
        }

        // Create upload record
        var upload = new Entities.Upload
        {
            UserId = userId,
            FileName = file.FileName,
            OriginalName = file.FileName,
            ShortCode = shortCode,
            ContentType = contentType,
            Size = file.Length,
            StoragePath = storagePath,
            ThumbnailPath = thumbnailPath,
            Width = width,
            Height = height,
            IsPublic = true
        };

        db.Uploads.Add(upload);

        // Update storage used
        settings.StorageUsed += file.Length;

        await db.SaveChangesAsync(ct);

        logger.LogInformation("File uploaded: {ShortCode} by user {UserId}", shortCode, userId);

        // Build response URLs
        var baseUrl = config["App:BaseUrl"] ?? "http://localhost:5000";
        var response = new UploadResponse(
            $"{baseUrl}/f/{shortCode}",
            $"{baseUrl}/api/uploads/{upload.Id}",
            thumbnailPath != null ? $"{baseUrl}/f/thumb_{shortCode}" : null);

        await SendAsync(response, cancellation: ct);
    }
}
