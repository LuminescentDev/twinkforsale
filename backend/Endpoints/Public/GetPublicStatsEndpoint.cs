using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Public;

public class PublicRecentUploadDto
{
    public string Id { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string ContentType { get; set; } = null!;
    public int ViewCount { get; set; }
}

public class PublicStatsResponse
{
    public int TotalUploads { get; set; }
    public long TotalViews { get; set; }
    public int TotalUsers { get; set; }
    public List<PublicRecentUploadDto> RecentUploads { get; set; } = [];
}

public class GetPublicStatsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/public/stats");
        AllowAnonymous();
        Description(x => x.WithTags("Public"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var totalUploads = await _db.Uploads.CountAsync(ct);
        var totalViews = await _db.Uploads.SumAsync(u => (long)u.ViewCount, ct);
        var totalUsers = await _db.Users.CountAsync(ct);

        var recentUploads = await _db.Uploads
            .OrderByDescending(u => u.CreatedAt)
            .Take(5)
            .Select(u => new PublicRecentUploadDto
            {
                Id = u.Id,
                CreatedAt = u.CreatedAt,
                ContentType = u.ContentType,
                ViewCount = u.ViewCount
            })
            .ToListAsync(ct);

        var response = new PublicStatsResponse
        {
            TotalUploads = totalUploads,
            TotalViews = totalViews,
            TotalUsers = totalUsers,
            RecentUploads = recentUploads
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
