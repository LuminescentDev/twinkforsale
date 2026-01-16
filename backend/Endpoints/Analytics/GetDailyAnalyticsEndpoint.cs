using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Analytics;

public class DailyAnalyticsRequest
{
    public int Days { get; set; } = 7;
}

public class DailyAnalyticsDto
{
    public string Date { get; set; } = null!; // yyyy-MM-dd
    public int TotalViews { get; set; }
    public int UniqueViews { get; set; }
    public int TotalDownloads { get; set; }
    public int UniqueDownloads { get; set; }
    public int UploadsCount { get; set; }
    public int UsersRegistered { get; set; }
}

public class GetDailyAnalyticsEndpoint(AppDbContext db) : Endpoint<DailyAnalyticsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/analytics/daily");
        AllowAnonymous();
        Description(x => x.WithTags("Analytics"));
    }

    public override async Task HandleAsync(DailyAnalyticsRequest req, CancellationToken ct)
    {
        var days = Math.Clamp(req.Days, 1, 90);
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(days - 1));
        var endDate = today.AddDays(1); // exclusive

        // Fetch view logs
        var viewLogs = await _db.ViewLogs
            .Where(v => v.ViewedAt >= startDate && v.ViewedAt < endDate)
            .Select(v => new { v.ViewedAt, v.IpAddress })
            .ToListAsync(ct);

        // Fetch download logs
        var downloadLogs = await _db.DownloadLogs
            .Where(d => d.DownloadedAt >= startDate && d.DownloadedAt < endDate)
            .Select(d => new { d.DownloadedAt, d.IpAddress })
            .ToListAsync(ct);

        // Fetch uploads
        var uploads = await _db.Uploads
            .Where(u => u.CreatedAt >= startDate && u.CreatedAt < endDate)
            .Select(u => u.CreatedAt)
            .ToListAsync(ct);

        // Fetch users
        var users = await _db.Users
            .Where(u => u.CreatedAt >= startDate && u.CreatedAt < endDate)
            .Select(u => u.CreatedAt)
            .ToListAsync(ct);

        var viewGroups = viewLogs
            .GroupBy(v => v.ViewedAt.Date)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Total = g.Count(),
                    Unique = g.Where(x => x.IpAddress != null)
                        .Select(x => x.IpAddress!)
                        .Distinct()
                        .Count()
                });

        var downloadGroups = downloadLogs
            .GroupBy(d => d.DownloadedAt.Date)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Total = g.Count(),
                    Unique = g.Where(x => x.IpAddress != null)
                        .Select(x => x.IpAddress!)
                        .Distinct()
                        .Count()
                });

        var uploadGroups = uploads
            .GroupBy(d => d.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var userGroups = users
            .GroupBy(d => d.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var result = new List<DailyAnalyticsDto>();
        var current = startDate;

        while (current <= today)
        {
            var dateKey = current.Date;
            var dateStr = dateKey.ToString("yyyy-MM-dd");

            viewGroups.TryGetValue(dateKey, out var viewStats);
            downloadGroups.TryGetValue(dateKey, out var downloadStats);
            uploadGroups.TryGetValue(dateKey, out var uploadsCount);
            userGroups.TryGetValue(dateKey, out var usersRegistered);

            result.Add(new DailyAnalyticsDto
            {
                Date = dateStr,
                TotalViews = viewStats?.Total ?? 0,
                UniqueViews = viewStats?.Unique ?? 0,
                TotalDownloads = downloadStats?.Total ?? 0,
                UniqueDownloads = downloadStats?.Unique ?? 0,
                UploadsCount = uploadsCount,
                UsersRegistered = usersRegistered
            });

            current = current.AddDays(1);
        }

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, result, (JsonSerializerOptions?)null, ct);
    }
}
