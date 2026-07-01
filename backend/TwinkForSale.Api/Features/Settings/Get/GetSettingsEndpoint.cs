using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Settings.Get;

public sealed class GetSettingsEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<UserSettingsResponse>
{
    public override void Configure()
    {
        Get("/api/settings");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var settings = await dbContext.UserSettings.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, ct)
            ?? new UserSettings { UserId = userId };

        await SendOkAsync(UserSettingsResponse.From(settings), ct);
    }
}

public sealed record UserSettingsResponse(
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
    bool ShowUserStats,
    string? CustomDomain,
    string? UploadDomainId,
    string? CustomSubdomain,
    bool UseCustomWords,
    int? DefaultExpirationDays,
    int? DefaultMaxViews,
    string? GlobalParticleConfig)
{
    public static UserSettingsResponse From(UserSettings settings) => new(
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
        settings.CustomDomain,
        settings.UploadDomainId,
        settings.CustomSubdomain,
        settings.UseCustomWords,
        settings.DefaultExpirationDays,
        settings.DefaultMaxViews,
        settings.GlobalParticleConfig);
}
