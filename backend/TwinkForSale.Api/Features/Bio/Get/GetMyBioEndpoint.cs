using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio.Get;

public sealed class GetMyBioEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<BioResponse>
{
    public override void Configure()
    {
        Get("/api/bio/me");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }

        var settings = await dbContext.UserSettings.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, ct);
        var links = await dbContext.BioLinks.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.Order)
            .Select(x => new BioLinkDto(x.Id, x.Title, x.Url, x.Icon, x.Order, x.IsActive, x.Clicks))
            .ToListAsync(ct);

        await SendOkAsync(BioResponse.From(settings, links), ct);
    }
}

public sealed record BioResponse(
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
    int Views,
    string? GradientConfig,
    string? ParticleConfig,
    string? DiscordUserId,
    bool ShowDiscord,
    string? DiscordConfig,
    IReadOnlyList<BioLinkDto> Links)
{
    public static BioResponse From(Domain.Entities.UserSettings? settings, IReadOnlyList<BioLinkDto> links) => new(
        settings?.BioUsername,
        settings?.BioDisplayName,
        settings?.BioDescription,
        settings?.BioProfileImage,
        settings?.BioBackgroundImage,
        settings?.BioBackgroundColor,
        settings?.BioTextColor,
        settings?.BioAccentColor,
        settings?.BioCustomCss,
        settings?.BioSpotifyTrack,
        settings?.BioIsPublic ?? false,
        settings?.BioViews ?? 0,
        settings?.BioGradientConfig,
        settings?.BioParticleConfig,
        settings?.BioDiscordUserId,
        settings?.BioShowDiscord ?? false,
        settings?.BioDiscordConfig,
        links);
}

public sealed record BioLinkDto(string Id, string Title, string Url, string? Icon, int Order, bool IsActive, int Clicks);
