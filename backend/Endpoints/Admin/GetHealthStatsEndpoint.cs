using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class HealthTopUserDto
{
    public string? Name { get; set; }
    public string Email { get; set; } = null!;
    public int UploadsLast7Days { get; set; }
    public int TotalUploads { get; set; }
    public long StorageUsed { get; set; }
}

public class HealthStatsResponse
{
    public int TotalUsers { get; set; }
    public int ApprovedUsers { get; set; }
    public int PendingUsers { get; set; }
    public int TotalUploads { get; set; }
    public long TotalStorageUsed { get; set; }
    public int RecentUploads { get; set; }
    public int RecentViews { get; set; }
    public int RecentDownloads { get; set; }
    public List<HealthTopUserDto> TopUsers { get; set; } = [];
}

public class GetHealthStatsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/health-stats");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var last24h = DateTime.UtcNow.AddHours(-24);
        var last7Days = DateTime.UtcNow.AddDays(-7);

        var totalUsers = await _db.Users.CountAsync(ct);
        var approvedUsers = await _db.Users.CountAsync(u => u.IsApproved, ct);
        var totalUploads = await _db.Uploads.CountAsync(ct);
        var totalStorageUsed = await _db.UserSettings.SumAsync(s => s.StorageUsed, ct);

        var recentUploads = await _db.Uploads.CountAsync(u => u.CreatedAt >= last24h, ct);
        var recentViews = await _db.ViewLogs.CountAsync(v => v.ViewedAt >= last24h, ct);
        var recentDownloads = await _db.DownloadLogs.CountAsync(d => d.DownloadedAt >= last24h, ct);

        var topUsers = await _db.Users
            .Include(u => u.Settings)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                TotalUploads = u.Uploads.Count,
                UploadsLast7Days = u.Uploads.Count(x => x.CreatedAt >= last7Days),
                StorageUsed = u.Settings != null ? u.Settings.StorageUsed : 0
            })
            .OrderByDescending(u => u.UploadsLast7Days)
            .Take(5)
            .ToListAsync(ct);

        var response = new HealthStatsResponse
        {
            TotalUsers = totalUsers,
            ApprovedUsers = approvedUsers,
            PendingUsers = totalUsers - approvedUsers,
            TotalUploads = totalUploads,
            TotalStorageUsed = totalStorageUsed,
            RecentUploads = recentUploads,
            RecentViews = recentViews,
            RecentDownloads = recentDownloads,
            TopUsers = topUsers.Select(u => new HealthTopUserDto
            {
                Name = u.Name ?? "Anonymous",
                Email = u.Email,
                UploadsLast7Days = u.UploadsLast7Days,
                TotalUploads = u.TotalUploads,
                StorageUsed = u.StorageUsed
            }).ToList()
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
