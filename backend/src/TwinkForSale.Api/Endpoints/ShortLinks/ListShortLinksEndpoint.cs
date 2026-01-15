using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.ShortLinks;

public class ShortLinkDto
{
    public string Id { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string ShortUrl { get; set; } = null!;
    public string TargetUrl { get; set; } = null!;
    public bool IsActive { get; set; }
    public int ClickCount { get; set; }
    public DateTime? LastClickedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class ListShortLinksEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public ListShortLinksEndpoint(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public override void Configure()
    {
        Get("/short-links");
        AuthSchemes("JWT", "ApiKey");
        Description(x => x.WithTags("Short Links"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5000";

        var links = await _db.ShortLinks
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShortLinkDto
            {
                Id = s.Id,
                Code = s.Code,
                ShortUrl = $"{baseUrl}/l/{s.Code}",
                TargetUrl = s.TargetUrl,
                IsActive = s.IsActive,
                ClickCount = s.ClickCount,
                LastClickedAt = s.LastClickedAt,
                CreatedAt = s.CreatedAt,
                ExpiresAt = s.ExpiresAt
            })
            .ToListAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, links, (JsonSerializerOptions?)null, ct);
    }
}
