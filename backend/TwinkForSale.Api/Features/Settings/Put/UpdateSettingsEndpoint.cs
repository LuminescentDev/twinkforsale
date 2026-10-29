using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Settings.Put;

public sealed class UpdateSettingsEndpoint(AppDbContext dbContext) : Endpoint<UpdateSettingsRequest, UpdateSettingsResponse>
{
    public override void Configure()
    {
        Put("/settings");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateSettingsRequest req, CancellationToken ct)
    {
        if (req.MaxUploads is not null || req.MaxFileSize is not null ||
            req.MaxStorageLimit is not null || req.MaxShortLinks is not null)
        {
            await SendAsync(new UpdateSettingsResponse(false), StatusCodes.Status403Forbidden, ct);
            return;
        }

        if (req.DefaultExpirationDays is <= 0 or > 36500 || req.DefaultMaxViews is <= 0)
        {
            await SendAsync(new UpdateSettingsResponse(false), StatusCodes.Status400BadRequest, ct);
            return;
        }

        var settings = await GetOrCreateSettingsAsync(ct);

        settings.UploadDomainId = req.UploadDomainId;
        settings.CustomSubdomain = req.CustomSubdomain;
        if (req.UseCustomWords is not null) settings.UseCustomWords = req.UseCustomWords.Value;
        settings.DefaultExpirationDays = req.DefaultExpirationDays;
        settings.DefaultMaxViews = req.DefaultMaxViews;
        settings.GlobalParticleConfig = req.GlobalParticleConfig;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateSettingsResponse(true), ct);
    }

    private async Task<UserSettings> GetOrCreateSettingsAsync(CancellationToken ct)
    {
        var userId = User.GetUserId() ?? throw new InvalidOperationException("Missing user id claim.");
        var settings = await dbContext.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings is not null) return settings;

        settings = new UserSettings { UserId = userId };
        dbContext.UserSettings.Add(settings);
        return settings;
    }
}

public sealed record UpdateSettingsRequest(
    int? MaxUploads,
    long? MaxFileSize,
    long? MaxStorageLimit,
    int? MaxShortLinks,
    string? UploadDomainId,
    string? CustomSubdomain,
    bool? UseCustomWords,
    int? DefaultExpirationDays,
    int? DefaultMaxViews,
    string? GlobalParticleConfig);

public sealed record UpdateSettingsResponse(bool Success);
