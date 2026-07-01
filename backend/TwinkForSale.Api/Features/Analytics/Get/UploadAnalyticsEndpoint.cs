using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;
using Microsoft.Extensions.Options;

namespace TwinkForSale.Api.Features.Analytics.Get;

public sealed class UploadAnalyticsEndpoint(
    AppDbContext dbContext,
    AnalyticsService analyticsService,
    IOptions<AppOptions> appOptions) : EndpointWithoutRequest<UploadAnalyticsResponse>
{
    public override void Configure()
    {
        Get("/api/analytics/uploads/{shortCode}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var shortCode = Route<string>("shortCode");
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(shortCode))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var upload = await dbContext.Uploads.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ShortCode == shortCode && x.UserId == userId, ct);

        if (upload is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var analytics = await analyticsService.GetUploadAnalyticsAsync(upload.Id, 30, ct);
        var viewLogs = await dbContext.ViewLogs.AsNoTracking()
            .Where(x => x.UploadId == upload.Id)
            .OrderByDescending(x => x.ViewedAt)
            .Take(100)
            .ToListAsync(ct);
        var downloadLogs = await dbContext.DownloadLogs.AsNoTracking()
            .Where(x => x.UploadId == upload.Id)
            .OrderByDescending(x => x.DownloadedAt)
            .Take(100)
            .ToListAsync(ct);

        var referrerStats = viewLogs
            .GroupBy(x => ClassifyReferrer(x.Referer))
            .ToDictionary(x => x.Key, x => x.Count());
        var deviceStats = viewLogs
            .GroupBy(x => ClassifyDevice(x.UserAgent))
            .ToDictionary(x => x.Key, x => x.Count());

        var cutoff = DateTimeOffset.UtcNow.AddHours(-24);
        var hourlyActivity = Enumerable.Range(0, 24)
            .Select(i => DateTimeOffset.UtcNow.AddHours(-(23 - i)).Hour)
            .Select(hour => new HourlyActivityDto(hour, viewLogs.Count(x => x.ViewedAt >= cutoff && x.ViewedAt.Hour == hour)))
            .ToList();

        await SendOkAsync(new UploadAnalyticsResponse(
            new UploadAnalyticsUploadDto(upload.Id, upload.OriginalName, upload.MimeType, upload.Size, upload.ShortCode, upload.CreatedAt, upload.Views, upload.Downloads, upload.LastViewed, upload.LastDownloaded),
            analytics,
            viewLogs.Take(20).Select(x => new ViewLogDto(RedactIpAddress(x.IpAddress), x.UserAgent, x.Referer, x.ViewedAt)).ToList(),
            downloadLogs.Take(20).Select(x => new DownloadLogDto(RedactIpAddress(x.IpAddress), x.UserAgent, x.Referer, x.DownloadedAt)).ToList(),
            referrerStats,
            deviceStats,
            hourlyActivity,
            upload.Views,
            upload.Downloads,
            appOptions.Value.BaseUrl.TrimEnd('/')), ct);
    }

    private static string RedactIpAddress(string? ipAddress)
    {
        if (string.IsNullOrWhiteSpace(ipAddress)) return "Unknown";
        var parts = ipAddress.Split('.');
        return parts.Length >= 2 ? $"{parts[0]}.{parts[1]}.xx.xx" : "xxx.xxx.xx.xx";
    }

    private static string ClassifyReferrer(string? referrer)
    {
        if (string.IsNullOrWhiteSpace(referrer)) return "Direct";
        var value = referrer.ToLowerInvariant();
        if (value.Contains("discord")) return "Discord";
        if (value.Contains("telegram")) return "Telegram";
        if (value.Contains("twitter") || value.Contains("x.com")) return "Twitter";
        if (value.Contains("reddit")) return "Reddit";
        if (value.Contains("facebook")) return "Facebook";
        return "Other";
    }

    private static string ClassifyDevice(string? userAgent)
    {
        var value = userAgent?.ToLowerInvariant() ?? string.Empty;
        if (value.Contains("mobile") || value.Contains("android") || value.Contains("iphone")) return "Mobile";
        if (value.Contains("tablet") || value.Contains("ipad")) return "Tablet";
        if (value.Contains("windows") || value.Contains("mac") || value.Contains("linux")) return "Desktop";
        return "Unknown";
    }
}

public sealed record UploadAnalyticsResponse(
    UploadAnalyticsUploadDto Upload,
    IReadOnlyList<DailyMetricDto> Analytics,
    IReadOnlyList<ViewLogDto> ViewLogs,
    IReadOnlyList<DownloadLogDto> DownloadLogs,
    IReadOnlyDictionary<string, int> ReferrerStats,
    IReadOnlyDictionary<string, int> DeviceStats,
    IReadOnlyList<HourlyActivityDto> HourlyActivity,
    int TotalViews,
    int TotalDownloads,
    string Origin);

public sealed record UploadAnalyticsUploadDto(string Id, string OriginalName, string MimeType, long Size, string ShortCode, DateTimeOffset CreatedAt, int Views, int Downloads, DateTimeOffset? LastViewed, DateTimeOffset? LastDownloaded);
public sealed record ViewLogDto(string IpAddress, string? UserAgent, string? Referer, DateTimeOffset ViewedAt);
public sealed record DownloadLogDto(string IpAddress, string? UserAgent, string? Referer, DateTimeOffset DownloadedAt);
public sealed record HourlyActivityDto(int Hour, int Count);
