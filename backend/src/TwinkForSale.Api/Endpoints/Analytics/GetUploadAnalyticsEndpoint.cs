using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Analytics;

public class UploadAnalyticsRequest
{
    public string UploadId { get; set; } = null!;
    public int Days { get; set; } = 7;
}

public class UploadAnalyticsDto
{
    public string Date { get; set; } = null!; // yyyy-MM-dd
    public int TotalViews { get; set; }
    public int UniqueViews { get; set; }
    public int TotalDownloads { get; set; }
    public int UniqueDownloads { get; set; }
}

public class GetUploadAnalyticsEndpoint(AppDbContext db) : Endpoint<UploadAnalyticsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/analytics/uploads/{UploadId}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Analytics"));
    }

    public override async Task HandleAsync(UploadAnalyticsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var upload = await _db.Uploads
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == req.UploadId, ct);

        if (upload == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && upload.UserId != userId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var days = Math.Clamp(req.Days, 1, 90);
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(days - 1));
        var endDate = today.AddDays(1); // exclusive

        var viewLogs = await _db.ViewLogs
            .Where(v => v.UploadId == req.UploadId && v.ViewedAt >= startDate && v.ViewedAt < endDate)
            .Select(v => new { v.ViewedAt, v.IpAddress })
            .ToListAsync(ct);

        var downloadLogs = await _db.DownloadLogs
            .Where(d => d.UploadId == req.UploadId && d.DownloadedAt >= startDate && d.DownloadedAt < endDate)
            .Select(d => new { d.DownloadedAt, d.IpAddress })
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

        var result = new List<UploadAnalyticsDto>();
        var current = startDate;

        while (current <= today)
        {
            var dateKey = current.Date;
            var dateStr = dateKey.ToString("yyyy-MM-dd");

            viewGroups.TryGetValue(dateKey, out var viewStats);
            downloadGroups.TryGetValue(dateKey, out var downloadStats);

            result.Add(new UploadAnalyticsDto
            {
                Date = dateStr,
                TotalViews = viewStats?.Total ?? 0,
                UniqueViews = viewStats?.Unique ?? 0,
                TotalDownloads = downloadStats?.Total ?? 0,
                UniqueDownloads = downloadStats?.Unique ?? 0
            });

            current = current.AddDays(1);
        }

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, result, (JsonSerializerOptions?)null, ct);
    }
}
