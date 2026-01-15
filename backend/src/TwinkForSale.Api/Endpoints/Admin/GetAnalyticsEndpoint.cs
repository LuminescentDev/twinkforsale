using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class SystemAnalyticsDto
{
    public int TotalUsers { get; set; }
    public int ApprovedUsers { get; set; }
    public int PendingUsers { get; set; }
    public int TotalUploads { get; set; }
    public long TotalStorageUsed { get; set; }
    public int TotalShortLinks { get; set; }
    public int TodayUploads { get; set; }
    public int TodayViews { get; set; }
    public int TodayClicks { get; set; }
    public List<DailyStatDto> RecentStats { get; set; } = [];
}

public class DailyStatDto
{
    public DateTime Date { get; set; }
    public int Uploads { get; set; }
    public int Views { get; set; }
    public int Downloads { get; set; }
    public int UsersRegistered { get; set; }
}

public class GetAnalyticsEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;

    public GetAnalyticsEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Get("/admin/analytics");
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

        var today = DateTime.UtcNow.Date;
        var thirtyDaysAgo = today.AddDays(-30);

        // Get totals
        var totalUsers = await _db.Users.CountAsync(ct);
        var approvedUsers = await _db.Users.CountAsync(u => u.IsApproved, ct);
        var totalUploads = await _db.Uploads.CountAsync(ct);
        var totalStorageUsed = await _db.UserSettings.SumAsync(s => s.StorageUsed, ct);
        var totalShortLinks = await _db.ShortLinks.CountAsync(ct);

        // Get today's stats
        var todayUploads = await _db.Uploads.CountAsync(u => u.CreatedAt >= today, ct);
        var todayViews = await _db.ViewLogs.CountAsync(v => v.ViewedAt >= today, ct);
        var todayClicks = await _db.ClickLogs.CountAsync(c => c.ClickedAt >= today, ct);

        // Get daily stats for last 30 days
        var recentStats = await _db.DailyAnalytics
            .Where(d => d.Date >= thirtyDaysAgo)
            .OrderByDescending(d => d.Date)
            .Select(d => new DailyStatDto
            {
                Date = d.Date,
                Uploads = d.UploadsCount,
                Views = d.TotalViews,
                Downloads = d.TotalDownloads,
                UsersRegistered = d.UsersRegistered
            })
            .ToListAsync(ct);

        var response = new SystemAnalyticsDto
        {
            TotalUsers = totalUsers,
            ApprovedUsers = approvedUsers,
            PendingUsers = totalUsers - approvedUsers,
            TotalUploads = totalUploads,
            TotalStorageUsed = totalStorageUsed,
            TotalShortLinks = totalShortLinks,
            TodayUploads = todayUploads,
            TodayViews = todayViews,
            TodayClicks = todayClicks,
            RecentStats = recentStats
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
