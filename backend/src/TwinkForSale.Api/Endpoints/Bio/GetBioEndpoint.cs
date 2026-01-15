using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Bio;

public class BioLinkDto
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? Icon { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; }
}

public class BioSettingsDto
{
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? ProfileImage { get; set; }
    public string? BackgroundImage { get; set; }
    public string? BackgroundColor { get; set; }
    public string? TextColor { get; set; }
    public string? AccentColor { get; set; }
    public string? CustomCss { get; set; }
    public string? SpotifyTrack { get; set; }
    public bool IsPublic { get; set; }
    public int Views { get; set; }
    public string? GradientConfig { get; set; }
    public string? ParticleConfig { get; set; }
    public string? DiscordUserId { get; set; }
    public bool ShowDiscord { get; set; }
    public string? DiscordConfig { get; set; }
    public List<BioLinkDto> Links { get; set; } = [];
}

public class GetBioEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/bio");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var settings = await _db.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (settings == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var links = await _db.BioLinks
            .Where(l => l.UserId == userId)
            .OrderBy(l => l.Order)
            .Select(l => new BioLinkDto
            {
                Id = l.Id,
                Title = l.Title,
                Url = l.Url,
                Icon = l.Icon,
                Order = l.Order,
                IsActive = l.IsActive
            })
            .ToListAsync(ct);

        var response = new BioSettingsDto
        {
            Username = settings.BioUsername,
            DisplayName = settings.BioDisplayName,
            Description = settings.BioDescription,
            ProfileImage = settings.BioProfileImage,
            BackgroundImage = settings.BioBackgroundImage,
            BackgroundColor = settings.BioBackgroundColor,
            TextColor = settings.BioTextColor,
            AccentColor = settings.BioAccentColor,
            CustomCss = settings.BioCustomCss,
            SpotifyTrack = settings.BioSpotifyTrack,
            IsPublic = settings.BioIsPublic,
            Views = settings.BioViews,
            GradientConfig = settings.BioGradientConfig,
            ParticleConfig = settings.BioParticleConfig,
            DiscordUserId = settings.BioDiscordUserId,
            ShowDiscord = settings.BioShowDiscord,
            DiscordConfig = settings.BioDiscordConfig,
            Links = links
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
