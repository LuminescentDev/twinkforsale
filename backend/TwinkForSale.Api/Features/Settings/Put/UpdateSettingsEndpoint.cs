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
        var settings = await GetOrCreateSettingsAsync(ct);

        if (req.MaxUploads is > 0) settings.MaxUploads = req.MaxUploads.Value;
        if (req.MaxFileSize is > 0) settings.MaxFileSize = req.MaxFileSize.Value;
        settings.MaxStorageLimit = req.MaxStorageLimit;
        if (req.MaxShortLinks is > 0) settings.MaxShortLinks = req.MaxShortLinks.Value;
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
