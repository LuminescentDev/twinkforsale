using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;
using TwinkForSale.Api.Services;
using TwinkForSale.Api.Services.Image;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Upload;

public class UploadResponse
{
    public string Url { get; set; } = null!;
    public string DeleteUrl { get; set; } = null!;
    public string? ThumbnailUrl { get; set; }
}

public class UploadFileEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storage;
    private readonly IImageService _imageService;
    private readonly IShortCodeService _shortCodeService;
    private readonly IConfiguration _config;
    private readonly ILogger<UploadFileEndpoint> _logger;

    public UploadFileEndpoint(
        AppDbContext db,
        IStorageService storage,
        IImageService imageService,
        IShortCodeService shortCodeService,
        IConfiguration config,
        ILogger<UploadFileEndpoint> logger)
    {
        _db = db;
        _storage = storage;
        _imageService = imageService;
        _shortCodeService = shortCodeService;
        _config = config;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/upload");
        AuthSchemes("ApiKey");
        AllowFileUploads();
        Description(x => x.WithTags("Upload"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        // Get user with settings
        var user = await _db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null || !user.IsApproved)
        {
            HttpContext.Response.StatusCode = 403;
            await HttpContext.Response.WriteAsync("User not approved", ct);
            return;
        }

        var file = Files.FirstOrDefault();
        if (file == null)
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("No file uploaded", ct);
            return;
        }

        var settings = user.Settings;
        if (settings == null)
        {
            HttpContext.Response.StatusCode = 500;
            await HttpContext.Response.WriteAsync("User settings not found", ct);
            return;
        }

        // Check file size limit
        if (file.Length > settings.MaxFileSize)
        {
            HttpContext.Response.StatusCode = 413;
            await HttpContext.Response.WriteAsync($"File too large. Max size: {settings.MaxFileSize} bytes", ct);
            return;
        }

        // Check storage limit
        if (settings.MaxStorageLimit.HasValue && settings.StorageUsed + file.Length > settings.MaxStorageLimit.Value)
        {
            HttpContext.Response.StatusCode = 413;
            await HttpContext.Response.WriteAsync("Storage limit exceeded", ct);
            return;
        }

        // Generate unique short code
        string shortCode;
        if (settings.UseCustomWords && !string.IsNullOrEmpty(settings.CustomWords))
        {
            var words = settings.CustomWords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            shortCode = _shortCodeService.GenerateFromWords(words);
        }
        else
        {
            shortCode = _shortCodeService.Generate();
        }

        // Ensure short code is unique
        while (await _db.Uploads.AnyAsync(u => u.ShortCode == shortCode, ct))
        {
            shortCode = _shortCodeService.Generate();
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{shortCode}{extension}";
        var contentType = file.ContentType ?? "application/octet-stream";

        // Save file to storage
        await using var stream = file.OpenReadStream();
        var storagePath = await _storage.SaveAsync(stream, fileName, contentType, ct);

        // Get image dimensions if applicable
        int? width = null;
        int? height = null;
        string? thumbnailPath = null;

        if (_imageService.IsImage(contentType))
        {
            stream.Position = 0;
            var dimensions = await _imageService.GetDimensionsAsync(stream, ct);
            if (dimensions != null)
            {
                width = dimensions.Width;
                height = dimensions.Height;
            }

            // Generate thumbnail for images
            stream.Position = 0;
            using var thumbStream = await _imageService.GenerateThumbnailAsync(stream, 200, 200, ct);
            thumbnailPath = await _storage.SaveAsync(thumbStream, $"thumb_{fileName}", "image/jpeg", ct);
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

        _db.Uploads.Add(upload);

        // Update storage used
        settings.StorageUsed += file.Length;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("File uploaded: {ShortCode} by user {UserId}", shortCode, userId);

        // Build response URLs
        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5000";
        var response = new UploadResponse
        {
            Url = $"{baseUrl}/f/{shortCode}",
            DeleteUrl = $"{baseUrl}/api/uploads/{upload.Id}",
            ThumbnailUrl = thumbnailPath != null ? $"{baseUrl}/f/thumb_{shortCode}" : null
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
