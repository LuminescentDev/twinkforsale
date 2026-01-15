using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Bio;

public static class BioLimitsDefaults
{
    public const int MaxBioLinks = 10;
    public const int MaxUsernameLength = 20;
    public const int MaxDisplayNameLength = 20;
    public const int MaxDescriptionLength = 1000;
    public const int MaxUrlLength = 200;
    public const int MaxLinkTitleLength = 50;
    public const int MaxIconLength = 20;
}

public class BioLimitsResponse
{
    public int MaxBioLinks { get; set; }
    public int MaxUsernameLength { get; set; }
    public int MaxDisplayNameLength { get; set; }
    public int MaxDescriptionLength { get; set; }
    public int MaxUrlLength { get; set; }
    public int MaxLinkTitleLength { get; set; }
    public int MaxIconLength { get; set; }
    public int CurrentBioLinks { get; set; }
}

public class BioUsernameAvailabilityRequest
{
    public string Username { get; set; } = null!;
    public string? UserId { get; set; }
}

public class BioUsernameAvailabilityResponse
{
    public bool Available { get; set; }
}

public class BioAnalyticsRequest
{
    public int Days { get; set; } = 7;
}

public class BioAnalyticsLinkDto
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public int Clicks { get; set; }
}

public class BioAnalyticsResponse
{
    public int TotalViews { get; set; }
    public Dictionary<string, int> ViewsByDate { get; set; } = [];
    public List<BioAnalyticsLinkDto> TopLinks { get; set; } = [];
    public int UniqueIps { get; set; }
}

public class GetBioLimitsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/bio/limits");
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

        var settings = await _db.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId, ct);
        var currentLinks = await _db.BioLinks.CountAsync(l => l.UserId == userId, ct);

        var response = new BioLimitsResponse
        {
            MaxBioLinks = settings?.MaxBioLinks ?? BioLimitsDefaults.MaxBioLinks,
            MaxUsernameLength = settings?.MaxUsernameLength ?? BioLimitsDefaults.MaxUsernameLength,
            MaxDisplayNameLength = settings?.MaxDisplayNameLength ?? BioLimitsDefaults.MaxDisplayNameLength,
            MaxDescriptionLength = settings?.MaxDescriptionLength ?? BioLimitsDefaults.MaxDescriptionLength,
            MaxUrlLength = settings?.MaxUrlLength ?? BioLimitsDefaults.MaxUrlLength,
            MaxLinkTitleLength = settings?.MaxLinkTitleLength ?? BioLimitsDefaults.MaxLinkTitleLength,
            MaxIconLength = settings?.MaxIconLength ?? BioLimitsDefaults.MaxIconLength,
            CurrentBioLinks = currentLinks
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class CheckBioUsernameAvailabilityEndpoint(AppDbContext db) : Endpoint<BioUsernameAvailabilityRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/bio/username-available");
        AllowAnonymous();
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(BioUsernameAvailabilityRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username))
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var existing = await _db.UserSettings
            .Select(s => new { s.UserId, s.BioUsername })
            .FirstOrDefaultAsync(s => s.BioUsername == req.Username, ct);

        var available = existing == null || (!string.IsNullOrEmpty(req.UserId) && existing.UserId == req.UserId);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new BioUsernameAvailabilityResponse
        {
            Available = available
        }, (JsonSerializerOptions?)null, ct);
    }
}

public class GetBioAnalyticsEndpoint(AppDbContext db) : Endpoint<BioAnalyticsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/bio/analytics");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(BioAnalyticsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var days = Math.Clamp(req.Days, 1, 365);
        var startDate = DateTime.UtcNow.AddDays(-days);

        var viewLogs = await _db.BioViews
            .Where(v => v.UserId == userId && v.ViewedAt >= startDate)
            .OrderBy(v => v.ViewedAt)
            .ToListAsync(ct);

        var linkClicks = await _db.BioLinks
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.Clicks)
            .Select(l => new BioAnalyticsLinkDto
            {
                Id = l.Id,
                Title = l.Title,
                Url = l.Url,
                Clicks = l.Clicks
            })
            .ToListAsync(ct);

        var viewsByDate = viewLogs
            .GroupBy(v => v.ViewedAt.Date)
            .ToDictionary(g => g.Key.ToString("yyyy-MM-dd"), g => g.Count());

        var uniqueIps = viewLogs
            .Select(v => v.IpAddress)
            .Where(ip => !string.IsNullOrWhiteSpace(ip))
            .Distinct()
            .Count();

        var response = new BioAnalyticsResponse
        {
            TotalViews = viewLogs.Count,
            ViewsByDate = viewsByDate,
            TopLinks = linkClicks,
            UniqueIps = uniqueIps
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}