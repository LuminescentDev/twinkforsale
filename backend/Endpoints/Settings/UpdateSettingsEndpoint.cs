using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Settings;

public record UpdateSettingsRequest(
    string? EmbedTitle,
    string? EmbedDescription,
    string? EmbedColor,
    string? EmbedAuthor,
    string? EmbedFooter,
    bool? ShowFileInfo,
    bool? ShowUploadDate,
    bool? UseCustomWords,
    string? CustomWords,
    string? UploadDomainId,
    string? CustomSubdomain,
    int? DefaultExpirationDays,
    int? DefaultMaxViews
);

public class UpdateSettings(AppDbContext db, ILogger<UpdateSettings> logger) : Endpoint<UpdateSettingsRequest, UserSettingsDto>
{
    public override void Configure()
    {
        Put("/settings");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(UpdateSettingsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var settings = await db.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (settings == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        // Update only provided fields
        if (req.EmbedTitle != null) settings.EmbedTitle = req.EmbedTitle;
        if (req.EmbedDescription != null) settings.EmbedDescription = req.EmbedDescription;
        if (req.EmbedColor != null) settings.EmbedColor = req.EmbedColor;
        if (req.EmbedAuthor != null) settings.EmbedAuthor = req.EmbedAuthor;
        if (req.EmbedFooter != null) settings.EmbedFooter = req.EmbedFooter;
        if (req.ShowFileInfo.HasValue) settings.ShowFileInfo = req.ShowFileInfo.Value;
        if (req.ShowUploadDate.HasValue) settings.ShowUploadDate = req.ShowUploadDate.Value;
        if (req.UseCustomWords.HasValue) settings.UseCustomWords = req.UseCustomWords.Value;
        if (req.CustomWords != null) settings.CustomWords = req.CustomWords;
        if (req.UploadDomainId != null) settings.UploadDomainId = req.UploadDomainId;
        if (req.CustomSubdomain != null) settings.CustomSubdomain = req.CustomSubdomain;
        if (req.DefaultExpirationDays.HasValue) settings.DefaultExpirationDays = req.DefaultExpirationDays;
        if (req.DefaultMaxViews.HasValue) settings.DefaultMaxViews = req.DefaultMaxViews;

        settings.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        logger.LogInformation("Settings updated for user {UserId}", userId);

        await SendAsync(new UserSettingsDto(
            settings.MaxUploads,
            settings.MaxFileSize,
            settings.MaxStorageLimit,
            settings.StorageUsed,
            settings.MaxShortLinks,
            settings.EmbedTitle,
            settings.EmbedDescription,
            settings.EmbedColor,
            settings.EmbedAuthor,
            settings.EmbedFooter,
            settings.ShowFileInfo,
            settings.ShowUploadDate,
            settings.ShowUserStats,
            settings.UseCustomWords,
            settings.CustomWords,
            settings.CustomDomain,
            settings.UploadDomainId,
            settings.CustomSubdomain,
            settings.DefaultExpirationDays,
            settings.DefaultMaxViews
        ), cancellation: ct);
    }
}
