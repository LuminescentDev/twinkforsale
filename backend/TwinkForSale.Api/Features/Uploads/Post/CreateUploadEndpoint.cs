using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
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
    IOptions<AppOptions> appOptions) : EndpointWithoutRequest<CreateUploadResponse>
{
    public override void Configure()
    {
        Post("/api/uploads", "/api/upload");
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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendAsync(new CreateUploadResponse(Error: "Authentication required."), StatusCodes.Status401Unauthorized, ct);
            return;
        }

        var form = await HttpContext.Request.ReadFormAsync(ct);
        var file = form.Files.GetFile("file");
        if (file is null)
        {
            await SendAsync(new CreateUploadResponse(Error: "No file provided."), StatusCodes.Status400BadRequest, ct);
            return;
        }

        var user = await dbContext.Users
            .Include(x => x.Uploads)
            .Include(x => x.Settings)
            .FirstAsync(x => x.Id == userId, ct);

        var apiKeyId = User.FindFirstValue(AppClaimTypes.ApiKeyId);
        if (!string.IsNullOrWhiteSpace(apiKeyId))
        {
            await dbContext.ApiKeys
                .Where(x => x.Id == apiKeyId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.LastUsed, DateTimeOffset.UtcNow), ct);
        }

        var settings = user.Settings ?? new UserSettings { UserId = user.Id };
        var maxUploads = settings.MaxUploads;
        if (user.Uploads.Count >= maxUploads)
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
        if (settings.StorageUsed + file.Length > storageLimit)
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
            await SendAsync(new CreateUploadResponse(Error: uploadResult.Error ?? "File upload failed."), StatusCodes.Status500InternalServerError, ct);
            return;
        }

        var expirationDays = ParseNullableInt(form["expirationDays"]);
        var maxViews = ParseNullableInt(form["maxViews"]);
        DateTimeOffset? expiresAt = expirationDays is > 0
            ? DateTimeOffset.UtcNow.AddDays(expirationDays.Value)
            : settings.DefaultExpirationDays is > 0
                ? DateTimeOffset.UtcNow.AddDays(settings.DefaultExpirationDays.Value)
                : null;

        var baseUrl = appOptions.Value.BaseUrl.TrimEnd('/');
        var fileUrl = $"{baseUrl}/f/{shortCode}";

        var upload = new Upload
        {
            Filename = uploadResult.Key,
            OriginalName = file.FileName,
            MimeType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            Size = file.Length,
            Url = fileUrl,
            ShortCode = shortCode,
            DeletionKey = deletionKey,
            UserId = user.Id,
            ExpiresAt = expiresAt,
            MaxViews = maxViews ?? settings.DefaultMaxViews
        };

        dbContext.Uploads.Add(upload);
        settings.StorageUsed += file.Length;
        if (user.Settings is null)
        {
            dbContext.UserSettings.Add(settings);
        }

        await dbContext.SaveChangesAsync(ct);

        await SendAsync(new CreateUploadResponse(
            Url: fileUrl,
            DeletionUrl: $"{baseUrl}/delete/{deletionKey}",
            ThumbnailUrl: upload.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) ? fileUrl : null), StatusCodes.Status201Created, ct);
    }

    private static int? ParseNullableInt(string? value)
    {
        return int.TryParse(value, out var result) ? result : null;
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
