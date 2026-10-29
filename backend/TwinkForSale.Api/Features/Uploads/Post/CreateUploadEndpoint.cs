using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MetadataExtractor;
using MetadataExtractor.Formats.Bmp;
using MetadataExtractor.Formats.Exif;
using MetadataExtractor.Formats.Gif;
using MetadataExtractor.Formats.Jpeg;
using MetadataExtractor.Formats.Png;
using MetadataExtractor.Formats.Photoshop;
using MetadataExtractor.Formats.WebP;
using System.Security.Claims;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Uploads.Post;

public sealed class CreateUploadEndpoint(
    AppDbContext dbContext,
    IFileStorage fileStorage,
    UploadCodeGenerator codeGenerator,
    IOptions<AppOptions> appOptions,
    ILogger<CreateUploadEndpoint> logger) : EndpointWithoutRequest<CreateUploadResponse>
{
    public override void Configure()
    {
        Post("/uploads", "/upload", "/api/upload", "/api/uploads");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
        AllowFileUploads();
        Summary(summary =>
        {
            summary.Summary = "Uploads a file.";
            summary.Description = "ShareX-compatible upload endpoint. Requires Authorization: Bearer {apiKey}.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        string? uploadedKey = null;
        var committed = false;
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
            {
                await SendAsync(new CreateUploadResponse(Error: "Authentication required."), StatusCodes.Status401Unauthorized, ct);
                return;
            }

            var form = await HttpContext.Request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault();
            if (file is null)
            {
                await SendAsync(new CreateUploadResponse(Error: "No file provided."), StatusCodes.Status400BadRequest, ct);
                return;
            }

            if (file.Length == 0 ||
                !TryParseLimit(form["expirationDays"], 36500, out var expirationDays) ||
                !TryParseLimit(form["maxViews"], int.MaxValue, out var maxViews))
            {
                await SendAsync(new CreateUploadResponse(Error: "Provide a non-empty file and positive expiration/view limits."), StatusCodes.Status400BadRequest, ct);
                return;
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
            // Serialize quota changes for a user across browser, ShareX, and API uploads.
            await dbContext.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
            var user = await dbContext.Users
                .Include(x => x.Settings)
                .ThenInclude(x => x!.UploadDomain)
                .FirstAsync(x => x.Id == userId, ct);

            var apiKeyId = User.FindFirstValue(AppClaimTypes.ApiKeyId);
            if (!string.IsNullOrWhiteSpace(apiKeyId))
            {
                await dbContext.ApiKeys
                    .Where(x => x.Id == apiKeyId)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.LastUsed, DateTimeOffset.UtcNow), ct);
            }

            var settings = user.Settings ?? new UserSettings { UserId = user.Id };
            UploadPreset? preset = null;
            UploadDomain? presetDomain = null;
            if (!string.IsNullOrWhiteSpace(form["presetId"]))
            {
                var presetId = form["presetId"].ToString();
                preset = await dbContext.UploadPresets.FirstOrDefaultAsync(x => x.Id == presetId && x.UserId == userId, ct);
                if (preset is null) { await SendAsync(new CreateUploadResponse(Error: "Upload preset not found."), 400, ct); return; }
                if (preset.UploadDomainId is not null)
                {
                    presetDomain = await dbContext.UploadDomains.FirstOrDefaultAsync(x => x.Id == preset.UploadDomainId && x.IsActive, ct);
                    if (presetDomain is null) { await SendAsync(new CreateUploadResponse(Error: "The preset domain is no longer active."), 400, ct); return; }
                }
            }
            var maxUploads = settings.MaxUploads;
            if (await dbContext.Uploads.CountAsync(x => x.UserId == userId, ct) >= maxUploads)
            {
                await SendAsync(new CreateUploadResponse(Error: "Upload limit exceeded."), StatusCodes.Status429TooManyRequests, ct);
                return;
            }

            if (file.Length > settings.MaxFileSize)
            {
                await SendAsync(new CreateUploadResponse(Error: "File too large."), StatusCodes.Status413PayloadTooLarge, ct);
                return;
            }

            var storageLimit = settings.MaxStorageLimit ?? appOptions.Value.BaseStorageLimit;
            if (file.Length > storageLimit - settings.StorageUsed)
            {
                await SendAsync(new CreateUploadResponse(Error: "Storage quota exceeded."), StatusCodes.Status413PayloadTooLarge, ct);
                return;
            }

            var shortCode = await codeGenerator.GenerateUniqueShortCodeAsync(ct);
            var deletionKey = EntityIds.NewId();
            var cleanFilename = CleanFilename(file.FileName);
            var storageKey = $"{shortCode}_{cleanFilename}";

            var uploadResult = await fileStorage.UploadAsync(file, storageKey, user.Id, ct);
            if (!uploadResult.Success || string.IsNullOrWhiteSpace(uploadResult.Key))
            {
                logger.LogError("Storage rejected an upload: {Error}", uploadResult.Error);
                await SendAsync(new CreateUploadResponse(Error: "File storage is unavailable. Please try again."), StatusCodes.Status500InternalServerError, ct);
                return;
            }
            uploadedKey = uploadResult.Key;

            var effectiveDays = form.ContainsKey("expirationDays") ? expirationDays : preset is not null ? preset.ExpirationDays : settings.DefaultExpirationDays;
            DateTimeOffset? expiresAt = effectiveDays is > 0 ? DateTimeOffset.UtcNow.AddDays(effectiveDays.Value) : null;

            var baseUrl = GetRequestBaseUrl();
            var uploadBaseUrl = GetUploadBaseUrl(settings, baseUrl);
            if (presetDomain is not null)
                uploadBaseUrl = $"https://{(presetDomain.SupportsSubdomains && !string.IsNullOrWhiteSpace(settings.CustomSubdomain) ? settings.CustomSubdomain.Trim() + "." : "")}{presetDomain.Domain.Trim().Trim('/')}";
            var fileUrl = $"{uploadBaseUrl}/f/{shortCode}";

            var mimeType = Microsoft.Net.Http.Headers.MediaTypeHeaderValue.TryParse(file.ContentType, out var parsedType)
                ? parsedType.MediaType.Value!.ToLowerInvariant() : "application/octet-stream";
            var (width, height) = await TryGetImageDimensionsAsync(file, mimeType, ct);

            var upload = new Upload
            {
                Filename = uploadResult.Key,
                OriginalName = file.FileName,
                MimeType = mimeType,
                Size = file.Length,
                Url = fileUrl,
                ShortCode = shortCode,
                DeletionKey = deletionKey,
                UserId = user.Id,
                ExpiresAt = expiresAt,
                MaxViews = form.ContainsKey("maxViews") ? maxViews : preset is not null ? preset.MaxViews : settings.DefaultMaxViews,
                EmbedTitle = preset?.EmbedTitle,
                EmbedDescription = preset?.EmbedDescription,
                EmbedColor = preset?.EmbedColor,
                Width = width,
                Height = height
            };

            dbContext.Uploads.Add(upload);
            settings.StorageUsed += file.Length;
            if (user.Settings is null)
            {
                dbContext.UserSettings.Add(settings);
            }

            await dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            committed = true;

            await SendAsync(new CreateUploadResponse(
                Url: fileUrl,
                DeletionUrl: $"{baseUrl}/delete/{deletionKey}",
                ThumbnailUrl: upload.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ? fileUrl : null), StatusCodes.Status201Created, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (InvalidDataException)
        {
            await SendAsync(new CreateUploadResponse(Error: "Invalid upload data."), StatusCodes.Status400BadRequest, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Upload failed.");
            await SendAsync(new CreateUploadResponse(Error: "Upload failed. Please try again."), StatusCodes.Status500InternalServerError, ct);
        }
        finally
        {
            if (uploadedKey is not null && !committed)
            {
                try
                {
                    await fileStorage.DeleteAsync(uploadedKey, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Could not remove an uncommitted upload.");
                }
            }
        }
    }

    private string GetRequestBaseUrl()
    {
        var configuredBaseUrl = appOptions.Value.BaseUrl.TrimEnd('/');
        if (!string.IsNullOrWhiteSpace(configuredBaseUrl) &&
            !configuredBaseUrl.Contains("localhost", StringComparison.OrdinalIgnoreCase) &&
            !configuredBaseUrl.Contains("127.0.0.1", StringComparison.OrdinalIgnoreCase))
        {
            return configuredBaseUrl;
        }

        if (HttpContext.Request.Host.HasValue)
        {
            return $"{HttpContext.Request.Scheme}://{HttpContext.Request.Host.Value}".TrimEnd('/');
        }

        return configuredBaseUrl;
    }

    private static string GetUploadBaseUrl(UserSettings settings, string fallbackBaseUrl)
    {
        var selectedDomain = settings.UploadDomain;
        if (selectedDomain?.IsActive == true && !string.IsNullOrWhiteSpace(selectedDomain.Domain))
        {
            var domain = selectedDomain.Domain.Trim().Trim('/');
            if (!string.IsNullOrWhiteSpace(settings.CustomSubdomain) && selectedDomain.SupportsSubdomains)
            {
                return $"https://{settings.CustomSubdomain.Trim()}.{domain}";
            }

            return $"https://{domain}";
        }

        return fallbackBaseUrl.TrimEnd('/');
    }

    private async Task<(int? Width, int? Height)> TryGetImageDimensionsAsync(IFormFile file, string mimeType, CancellationToken ct)
    {
        if (!mimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return (null, null);
        }

        try
        {
            await using var stream = file.OpenReadStream();
            ct.ThrowIfCancellationRequested();
            var directories = ImageMetadataReader.ReadMetadata(stream);
            foreach (var directory in directories)
            {
                var tags = directory switch
                {
                    JpegDirectory => (JpegDirectory.TagImageWidth, JpegDirectory.TagImageHeight),
                    PngDirectory => (PngDirectory.TagImageWidth, PngDirectory.TagImageHeight),
                    GifHeaderDirectory => (GifHeaderDirectory.TagImageWidth, GifHeaderDirectory.TagImageHeight),
                    WebPDirectory => (WebPDirectory.TagImageWidth, WebPDirectory.TagImageHeight),
                    BmpHeaderDirectory => (BmpHeaderDirectory.TagImageWidth, BmpHeaderDirectory.TagImageHeight),
                    PsdHeaderDirectory => (PsdHeaderDirectory.TagImageWidth, PsdHeaderDirectory.TagImageHeight),
                    ExifIfd0Directory => (ExifDirectoryBase.TagImageWidth, ExifDirectoryBase.TagImageHeight),
                    _ => (0, 0)
                };
                if (tags != (0, 0) && directory.TryGetInt32(tags.Item1, out var width) &&
                    directory.TryGetInt32(tags.Item2, out var height) && width > 0 && height != 0 && height != int.MinValue)
                {
                    return (width, Math.Abs(height));
                }
            }
            return (null, null);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read image dimensions for {FileName}.", file.FileName);
            return (null, null);
        }
    }

    private static bool TryParseLimit(string? value, int maximum, out int? result)
    {
        result = null;
        if (string.IsNullOrWhiteSpace(value)) return true;
        if (!int.TryParse(value, out var parsed) || parsed <= 0 || parsed > maximum) return false;
        result = parsed;
        return true;
    }

    private static string CleanFilename(string fileName)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var cleaned = string.Concat(fileName.Select(ch => char.IsWhiteSpace(ch) ? '-' : invalid.Contains(ch) ? '_' : ch));
        return string.IsNullOrWhiteSpace(cleaned) ? "file" : cleaned;
    }
}

public sealed record CreateUploadResponse(
    string? Url = null,
    string? DeletionUrl = null,
    string? ThumbnailUrl = null,
    string? Error = null);
