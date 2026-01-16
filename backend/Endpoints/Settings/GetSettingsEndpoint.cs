using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Settings;

public record UserSettingsDto(
    int MaxUploads,
    long MaxFileSize,
    long? MaxStorageLimit,
    long StorageUsed,
    int MaxShortLinks,
    string? EmbedTitle,
    string? EmbedDescription,
    string? EmbedColor,
    string? EmbedAuthor,
    string? EmbedFooter,
    bool ShowFileInfo,
    bool ShowUploadDate,
    bool UseCustomWords,
    string? CustomWords,
    string? CustomDomain,
    string? UploadDomainId,
    string? CustomSubdomain,
    int? DefaultExpirationDays,
    int? DefaultMaxViews
);

public class GetSettings(AppDbContext db) : EndpointWithoutRequest<UserSettingsDto>
{
    public override void Configure()
    {
        Get("/settings");
        AuthSchemes("JWT", "ApiKey");
    }

    public override async Task HandleAsync(CancellationToken ct)
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
