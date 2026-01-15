using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;
using TwinkForSale.Api.Services;

namespace TwinkForSale.Api.Endpoints.Shorten;

public class ShortenRequest
{
    public string Url { get; set; } = null!;
    public string? CustomCode { get; set; }
}

public class ShortenResponse
{
    public string ShortUrl { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string OriginalUrl { get; set; } = null!;
}

public class ShortenUrlEndpoint : Endpoint<ShortenRequest>
{
    private readonly AppDbContext _db;
    private readonly IShortCodeService _shortCodeService;
    private readonly IConfiguration _config;
    private readonly ILogger<ShortenUrlEndpoint> _logger;

    public ShortenUrlEndpoint(
        AppDbContext db,
        IShortCodeService shortCodeService,
        IConfiguration config,
        ILogger<ShortenUrlEndpoint> logger)
    {
        _db = db;
        _shortCodeService = shortCodeService;
        _config = config;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/shorten");
        AuthSchemes("ApiKey");
        Description(x => x.WithTags("Shorten"));
    }

    public override async Task HandleAsync(ShortenRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        // Validate URL
        if (!Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Invalid URL", ct);
            return;
        }

        // Get user with settings
        var user = await _db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null || !user.IsApproved)
        {
            HttpContext.Response.StatusCode = 403;
            await HttpContext.Response.WriteAsync("User not approved", ct);
            return;
        }

        var settings = user.Settings;
        if (settings == null)
        {
            HttpContext.Response.StatusCode = 500;
            await HttpContext.Response.WriteAsync("User settings not found", ct);
            return;
        }

        // Check short link limit
        var currentCount = await _db.ShortLinks.CountAsync(s => s.UserId == userId, ct);
        if (currentCount >= settings.MaxShortLinks)
        {
            HttpContext.Response.StatusCode = 403;
            await HttpContext.Response.WriteAsync("Short link limit reached", ct);
            return;
        }

        // Generate or validate short code
        string code;
        if (!string.IsNullOrEmpty(req.CustomCode))
        {
            // Validate custom code
            if (req.CustomCode.Length < 3 || req.CustomCode.Length > 32)
            {
                HttpContext.Response.StatusCode = 400;
                await HttpContext.Response.WriteAsync("Custom code must be 3-32 characters", ct);
                return;
            }

            if (await _db.ShortLinks.AnyAsync(s => s.Code == req.CustomCode, ct))
            {
                HttpContext.Response.StatusCode = 409;
                await HttpContext.Response.WriteAsync("Custom code already in use", ct);
                return;
            }

            code = req.CustomCode;
        }
        else
        {
            code = _shortCodeService.Generate();
            while (await _db.ShortLinks.AnyAsync(s => s.Code == code, ct))
            {
                code = _shortCodeService.Generate();
            }
        }

        // Create short link
        var shortLink = new ShortLink
        {
            UserId = userId,
            Code = code,
            TargetUrl = req.Url,
            IsActive = true
        };

        _db.ShortLinks.Add(shortLink);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Short link created: {Code} -> {Url} by user {UserId}", code, req.Url, userId);

        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5000";
        var response = new ShortenResponse
        {
            ShortUrl = $"{baseUrl}/l/{code}",
            Code = code,
            OriginalUrl = req.Url
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
