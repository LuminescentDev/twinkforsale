using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Analytics;

public class UserAnalyticsRequest
{
    public string UserId { get; set; } = null!;
    public int Days { get; set; } = 7;
}

public class UserAnalyticsDto
{
    public string Date { get; set; } = null!; // yyyy-MM-dd
    public int TotalViews { get; set; }
    public int UniqueViews { get; set; }
    public int UploadsCount { get; set; }
    public int UsersRegistered { get; set; }
}

public class GetUserAnalyticsEndpoint(AppDbContext db) : Endpoint<UserAnalyticsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/analytics/users/{UserId}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Analytics"));
    }

    public override async Task HandleAsync(UserAnalyticsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && req.UserId != userId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var days = Math.Clamp(req.Days, 1, 90);
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(days - 1));
        var endDate = today.AddDays(1); // exclusive

        var uploadIds = await _db.Uploads
            .Where(u => u.UserId == req.UserId)
            .Select(u => u.Id)
            .ToListAsync(ct);

        if (uploadIds.Count == 0)
        {
            var emptyResult = new List<UserAnalyticsDto>();
            var currentEmpty = startDate;
            while (currentEmpty <= today)
            {
                emptyResult.Add(new UserAnalyticsDto
                {
                    Date = currentEmpty.ToString("yyyy-MM-dd"),
                    TotalViews = 0,
                    UniqueViews = 0,
                    UploadsCount = 0,
                    UsersRegistered = 0
                });
                currentEmpty = currentEmpty.AddDays(1);
            }

            HttpContext.Response.ContentType = "application/json";
            await JsonSerializer.SerializeAsync(HttpContext.Response.Body, emptyResult, (JsonSerializerOptions?)null, ct);
            return;
        }

        var viewLogs = await _db.ViewLogs
            .Where(v => uploadIds.Contains(v.UploadId) && v.ViewedAt >= startDate && v.ViewedAt < endDate)
            .Select(v => new { v.ViewedAt, v.IpAddress })
            .ToListAsync(ct);

        var uploads = await _db.Uploads
            .Where(u => u.UserId == req.UserId && u.CreatedAt >= startDate && u.CreatedAt < endDate)
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

        var uploadGroups = uploads
            .GroupBy(d => d.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var result = new List<UserAnalyticsDto>();
        var current = startDate;

        while (current <= today)
        {
            var dateKey = current.Date;
            var dateStr = dateKey.ToString("yyyy-MM-dd");

            viewGroups.TryGetValue(dateKey, out var viewStats);
            uploadGroups.TryGetValue(dateKey, out var uploadsCount);

            result.Add(new UserAnalyticsDto
            {
                Date = dateStr,
                TotalViews = viewStats?.Total ?? 0,
                UniqueViews = viewStats?.Unique ?? 0,
                UploadsCount = uploadsCount,
                UsersRegistered = 0
            });

            current = current.AddDays(1);
        }

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, result, (JsonSerializerOptions?)null, ct);
    }
}
