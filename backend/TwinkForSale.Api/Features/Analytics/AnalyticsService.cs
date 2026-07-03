using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Analytics;

public sealed class AnalyticsService(AppDbContext dbContext)
{
    public async Task<IReadOnlyList<DailyMetricDto>> GetGlobalAnalyticsAsync(int days, CancellationToken ct)
    {
        var range = DateRange.ForLastDays(days);
        var stored = await dbContext.DailyAnalytics.AsNoTracking()
            .Where(x => x.Date >= range.Start && x.Date < range.Today)
            .OrderBy(x => x.Date)
            .ToListAsync(ct);

        var today = await GetGlobalTodayAnalyticsAsync(range.Today, range.Tomorrow, ct);

        return range.MapDays(date =>
        {
            if (date == range.TodayDate) return today;

            var metric = stored.FirstOrDefault(x => DateOnly.FromDateTime(x.Date.UtcDateTime) == date);
            return metric is null
                ? DailyMetricDto.Empty(date)
                : new DailyMetricDto(
                    date.ToString("yyyy-MM-dd"),
                    metric.TotalViews,
                    metric.UniqueViews,
                    metric.TotalDownloads,
                    metric.UniqueDownloads,
                    metric.UploadsCount,
                    metric.UsersRegistered);
        });
    }

    public async Task<IReadOnlyList<DailyMetricDto>> GetUserAnalyticsAsync(string userId, int days, CancellationToken ct)
    {
        var range = DateRange.ForLastDays(days);
        var uploadIds = await dbContext.Uploads.AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.Id)
            .ToListAsync(ct);

        if (uploadIds.Count == 0)
        {
            return range.MapDays(DailyMetricDto.Empty);
        }

        var views = await dbContext.ViewLogs.AsNoTracking()
            .Where(x => uploadIds.Contains(x.UploadId) && x.ViewedAt >= range.Start && x.ViewedAt < range.Tomorrow)
            .Select(x => new { x.ViewedAt, x.IpAddress })
            .ToListAsync(ct);

        var downloads = await dbContext.DownloadLogs.AsNoTracking()
            .Where(x => uploadIds.Contains(x.UploadId) && x.DownloadedAt >= range.Start && x.DownloadedAt < range.Tomorrow)
            .Select(x => new { x.DownloadedAt, x.IpAddress })
            .ToListAsync(ct);

        var uploads = await dbContext.Uploads.AsNoTracking()
            .Where(x => x.UserId == userId && x.CreatedAt >= range.Start && x.CreatedAt < range.Tomorrow)
            .Select(x => x.CreatedAt)
            .ToListAsync(ct);

        return range.MapDays(date =>
        {
            var dayViews = views.Where(x => DateOnly.FromDateTime(x.ViewedAt.UtcDateTime) == date).ToList();
            var dayDownloads = downloads.Where(x => DateOnly.FromDateTime(x.DownloadedAt.UtcDateTime) == date).ToList();

            return new DailyMetricDto(
                date.ToString("yyyy-MM-dd"),
                dayViews.Count,
                dayViews.Select(x => x.IpAddress).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Count(),
                dayDownloads.Count,
                dayDownloads.Select(x => x.IpAddress).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Count(),
                uploads.Count(x => DateOnly.FromDateTime(x.UtcDateTime) == date),
                0);
        });
    }

    public async Task<IReadOnlyList<DailyMetricDto>> GetUploadAnalyticsAsync(string uploadId, int days, CancellationToken ct)
    {
        var range = DateRange.ForLastDays(days);
        var views = await dbContext.ViewLogs.AsNoTracking()
            .Where(x => x.UploadId == uploadId && x.ViewedAt >= range.Start && x.ViewedAt < range.Tomorrow)
            .Select(x => new { x.ViewedAt, x.IpAddress })
            .ToListAsync(ct);

        var downloads = await dbContext.DownloadLogs.AsNoTracking()
            .Where(x => x.UploadId == uploadId && x.DownloadedAt >= range.Start && x.DownloadedAt < range.Tomorrow)
            .Select(x => new { x.DownloadedAt, x.IpAddress })
            .ToListAsync(ct);

        return range.MapDays(date =>
        {
            var dayViews = views.Where(x => DateOnly.FromDateTime(x.ViewedAt.UtcDateTime) == date).ToList();
            var dayDownloads = downloads.Where(x => DateOnly.FromDateTime(x.DownloadedAt.UtcDateTime) == date).ToList();

            return new DailyMetricDto(
                date.ToString("yyyy-MM-dd"),
                dayViews.Count,
                dayViews.Select(x => x.IpAddress).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Count(),
                dayDownloads.Count,
                dayDownloads.Select(x => x.IpAddress).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Count(),
                0,
                0);
        });
    }

    public async Task UpdateDailyAnalyticsAsync(CancellationToken ct)
    {
        var today = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
        var tomorrow = today.AddDays(1);
        var metric = await GetGlobalTodayAnalyticsAsync(today, tomorrow, ct);

        var analytics = await dbContext.DailyAnalytics.FirstOrDefaultAsync(x => x.Date == today, ct);
        if (analytics is null)
        {
            analytics = new DailyAnalytics { Date = today };
            dbContext.DailyAnalytics.Add(analytics);
        }

        analytics.TotalViews = metric.TotalViews;
        analytics.UniqueViews = metric.UniqueViews;
        analytics.TotalDownloads = metric.TotalDownloads;
        analytics.UniqueDownloads = metric.UniqueDownloads;
        analytics.UploadsCount = metric.UploadsCount;
        analytics.UsersRegistered = metric.UsersRegistered;
        analytics.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(ct);
    }

    private async Task<DailyMetricDto> GetGlobalTodayAnalyticsAsync(DateTimeOffset today, DateTimeOffset tomorrow, CancellationToken ct)
    {
        var views = await dbContext.ViewLogs.AsNoTracking()
            .Where(x => x.ViewedAt >= today && x.ViewedAt < tomorrow)
            .Select(x => x.IpAddress)
            .ToListAsync(ct);

        var downloads = await dbContext.DownloadLogs.AsNoTracking()
            .Where(x => x.DownloadedAt >= today && x.DownloadedAt < tomorrow)
            .Select(x => x.IpAddress)
            .ToListAsync(ct);

        var uploadsCount = await dbContext.Uploads.CountAsync(x => x.CreatedAt >= today && x.CreatedAt < tomorrow, ct);
        var usersRegistered = await dbContext.Users.CountAsync(x => x.CreatedAt >= today && x.CreatedAt < tomorrow, ct);

        return new DailyMetricDto(
            DateOnly.FromDateTime(today.UtcDateTime).ToString("yyyy-MM-dd"),
            views.Count,
            views.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Count(),
            downloads.Count,
            downloads.Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().Count(),
            uploadsCount,
            usersRegistered);
    }

    private sealed record DateRange(DateTimeOffset Start, DateTimeOffset Today, DateTimeOffset Tomorrow, DateOnly StartDate, DateOnly EndDate, DateOnly TodayDate)
    {
        public static DateRange ForLastDays(int days)
        {
            var safeDays = Math.Clamp(days, 1, 365);
            var today = new DateTimeOffset(DateTimeOffset.UtcNow.Date, TimeSpan.Zero);
            var start = today.AddDays(-(safeDays - 1));
            return new DateRange(
                start,
                today,
                today.AddDays(1),
                DateOnly.FromDateTime(start.UtcDateTime),
                DateOnly.FromDateTime(today.UtcDateTime),
                DateOnly.FromDateTime(today.UtcDateTime));
        }

        public IReadOnlyList<DailyMetricDto> MapDays(Func<DateOnly, DailyMetricDto> map)
        {
            var result = new List<DailyMetricDto>();
            for (var date = StartDate; date <= EndDate; date = date.AddDays(1))
            {
                result.Add(map(date));
            }

            return result;
        }
    }
}

public sealed record DailyMetricDto(
    string Date,
    int TotalViews,
    int UniqueViews,
    int TotalDownloads,
    int UniqueDownloads,
    int UploadsCount,
    int UsersRegistered)
{
    public static DailyMetricDto Empty(DateOnly date) => new(date.ToString("yyyy-MM-dd"), 0, 0, 0, 0, 0, 0);
}
