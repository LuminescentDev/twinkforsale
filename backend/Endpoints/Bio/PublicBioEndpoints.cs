using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Bio;

public class PublicBioRequest
{
    public string Username { get; set; } = null!;
}

public class PublicBioLinkDto
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? Icon { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; }
}

public class PublicBioPageDto
{
    public string Username { get; set; } = null!;
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
    public List<PublicBioLinkDto> Links { get; set; } = [];
}

public class TrackBioViewRequest
{
    public string Username { get; set; } = null!;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referer { get; set; }
}

public class TrackBioLinkClickRequest
{
    public string Id { get; set; } = null!;
}

public class GetPublicBioEndpoint(AppDbContext db) : Endpoint<PublicBioRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/bio/public/{Username}");
        AllowAnonymous();
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(PublicBioRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username))
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .Include(u => u.BioLinks)
            .FirstOrDefaultAsync(u => u.IsApproved
                                  && u.Settings != null
                                  && u.Settings.BioUsername == req.Username
                                  && u.Settings.BioIsPublic,
                ct);

        if (user?.Settings == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var links = user.BioLinks
            .Where(l => l.IsActive)
            .OrderBy(l => l.Order)
            .Select(l => new PublicBioLinkDto
            {
                Id = l.Id,
                Title = l.Title,
                Url = l.Url,
                Icon = l.Icon,
                Order = l.Order,
                IsActive = l.IsActive
            })
            .ToList();

        var response = new PublicBioPageDto
        {
            Username = user.Settings.BioUsername ?? req.Username,
            DisplayName = user.Settings.BioDisplayName,
            Description = user.Settings.BioDescription,
            ProfileImage = user.Settings.BioProfileImage,
            BackgroundImage = user.Settings.BioBackgroundImage,
            BackgroundColor = user.Settings.BioBackgroundColor,
            TextColor = user.Settings.BioTextColor,
            AccentColor = user.Settings.BioAccentColor,
            CustomCss = user.Settings.BioCustomCss,
            SpotifyTrack = user.Settings.BioSpotifyTrack,
            IsPublic = user.Settings.BioIsPublic,
            Views = user.Settings.BioViews,
            GradientConfig = user.Settings.BioGradientConfig,
            ParticleConfig = user.Settings.BioParticleConfig,
            DiscordUserId = user.Settings.BioDiscordUserId,
            ShowDiscord = user.Settings.BioShowDiscord,
            DiscordConfig = user.Settings.BioDiscordConfig,
            Links = links
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class TrackBioViewEndpoint(AppDbContext db) : Endpoint<TrackBioViewRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Post("/bio/public/{Username}/view");
        AllowAnonymous();
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(TrackBioViewRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username))
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var settings = await _db.UserSettings
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.BioUsername == req.Username && s.BioIsPublic, ct);

        if (settings?.User == null || !settings.User.IsApproved)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        settings.BioViews += 1;
        settings.BioLastViewed = DateTime.UtcNow;

        _db.BioViews.Add(new BioView
        {
            UserId = settings.UserId,
            IpAddress = req.IpAddress,
            UserAgent = req.UserAgent,
            Referer = req.Referer
        });

        await _db.SaveChangesAsync(ct);
        HttpContext.Response.StatusCode = 204;
    }
}

public class TrackBioLinkClickEndpoint(AppDbContext db) : Endpoint<TrackBioLinkClickRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Post("/bio/links/{Id}/click");
        AllowAnonymous();
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(TrackBioLinkClickRequest req, CancellationToken ct)
    {
        var link = await _db.BioLinks.FirstOrDefaultAsync(l => l.Id == req.Id, ct);
        if (link == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        link.Clicks += 1;
        link.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        HttpContext.Response.StatusCode = 204;
    }
}