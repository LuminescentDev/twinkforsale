using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Security;

namespace TwinkForSale.Api.Features.Bio.Put;

public sealed class UpdateMyBioEndpoint(AppDbContext dbContext) : Endpoint<UpdateBioRequest, UpdateBioResponse>
{
    public override void Configure()
    {
        Put("/api/bio/me");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateBioRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }

        if (!string.IsNullOrWhiteSpace(req.Username))
        {
            var taken = await dbContext.UserSettings.AnyAsync(x => x.BioUsername == req.Username && x.UserId != userId, ct);
            if (taken) { await SendAsync(new UpdateBioResponse(false, "Username already taken."), StatusCodes.Status409Conflict, ct); return; }
        }

        var settings = await dbContext.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings is null)
        {
            settings = new UserSettings { UserId = userId };
            dbContext.UserSettings.Add(settings);
        }

        settings.BioUsername = req.Username;
        settings.BioDisplayName = req.DisplayName;
        settings.BioDescription = req.Description;
        settings.BioProfileImage = req.ProfileImage;
        settings.BioBackgroundImage = req.BackgroundImage;
        settings.BioBackgroundColor = req.BackgroundColor;
        settings.BioTextColor = req.TextColor;
        settings.BioAccentColor = req.AccentColor;
        settings.BioCustomCss = CssSanitizer.Sanitize(req.CustomCss);
        settings.BioSpotifyTrack = req.SpotifyTrack;
        settings.BioIsPublic = req.IsPublic;
        settings.BioGradientConfig = req.GradientConfig;
        settings.BioParticleConfig = req.ParticleConfig;
        settings.BioDiscordUserId = req.DiscordUserId;
        settings.BioShowDiscord = req.ShowDiscord;
        settings.BioDiscordConfig = req.DiscordConfig;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateBioResponse(true), ct);
    }
}

public sealed record UpdateBioRequest(
    string? Username,
    string? DisplayName,
    string? Description,
    string? ProfileImage,
    string? BackgroundImage,
    string? BackgroundColor,
    string? TextColor,
    string? AccentColor,
    string? CustomCss,
    string? SpotifyTrack,
    bool IsPublic,
    string? GradientConfig,
    string? ParticleConfig,
    string? DiscordUserId,
    bool ShowDiscord,
    string? DiscordConfig);

public sealed record UpdateBioResponse(bool Success, string? Error = null);
