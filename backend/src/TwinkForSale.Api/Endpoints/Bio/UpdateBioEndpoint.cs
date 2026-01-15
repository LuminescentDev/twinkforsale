using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Bio;

public class UpdateBioRequest
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
    public bool? IsPublic { get; set; }
    public string? GradientConfig { get; set; }
    public string? ParticleConfig { get; set; }
    public string? DiscordUserId { get; set; }
    public bool? ShowDiscord { get; set; }
    public string? DiscordConfig { get; set; }
}

public class UpdateBioEndpoint : Endpoint<UpdateBioRequest>
{
    private readonly AppDbContext _db;
    private readonly ILogger<UpdateBioEndpoint> _logger;

    public UpdateBioEndpoint(AppDbContext db, ILogger<UpdateBioEndpoint> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override void Configure()
    {
        Put("/bio");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(UpdateBioRequest req, CancellationToken ct)
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

        // Validate username if changing
        if (req.Username != null && req.Username != settings.BioUsername)
        {
            // Check uniqueness
            var existing = await _db.UserSettings
                .AnyAsync(s => s.BioUsername == req.Username && s.UserId != userId, ct);

            if (existing)
            {
                HttpContext.Response.StatusCode = 409;
                await HttpContext.Response.WriteAsync("Username already taken", ct);
                return;
            }

            // Validate format
            if (!System.Text.RegularExpressions.Regex.IsMatch(req.Username, @"^[a-zA-Z0-9_-]{3,20}$"))
            {
                HttpContext.Response.StatusCode = 400;
                await HttpContext.Response.WriteAsync("Username must be 3-20 characters, alphanumeric with _ and -", ct);
                return;
            }
        }

        // Update fields
        if (req.Username != null) settings.BioUsername = req.Username;
        if (req.DisplayName != null) settings.BioDisplayName = req.DisplayName;
        if (req.Description != null) settings.BioDescription = req.Description;
        if (req.ProfileImage != null) settings.BioProfileImage = req.ProfileImage;
        if (req.BackgroundImage != null) settings.BioBackgroundImage = req.BackgroundImage;
        if (req.BackgroundColor != null) settings.BioBackgroundColor = req.BackgroundColor;
        if (req.TextColor != null) settings.BioTextColor = req.TextColor;
        if (req.AccentColor != null) settings.BioAccentColor = req.AccentColor;
        if (req.CustomCss != null) settings.BioCustomCss = req.CustomCss;
        if (req.SpotifyTrack != null) settings.BioSpotifyTrack = req.SpotifyTrack;
        if (req.IsPublic.HasValue) settings.BioIsPublic = req.IsPublic.Value;
        if (req.GradientConfig != null) settings.BioGradientConfig = req.GradientConfig;
        if (req.ParticleConfig != null) settings.BioParticleConfig = req.ParticleConfig;
        if (req.DiscordUserId != null) settings.BioDiscordUserId = req.DiscordUserId;
        if (req.ShowDiscord.HasValue) settings.BioShowDiscord = req.ShowDiscord.Value;
        if (req.DiscordConfig != null) settings.BioDiscordConfig = req.DiscordConfig;

        settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Bio updated for user {UserId}", userId);

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
