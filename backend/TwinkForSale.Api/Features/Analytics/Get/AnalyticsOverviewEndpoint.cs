using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Analytics.Get;

public sealed class AnalyticsOverviewEndpoint(AppDbContext dbContext, AnalyticsService analyticsService) : EndpointWithoutRequest<AnalyticsOverviewResponse>
{
    public override void Configure()
    {
        Get("/analytics");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var user = await dbContext.Users.AsNoTracking()
            .Include(x => x.Settings)
            .FirstOrDefaultAsync(x => x.Id == userId, ct);

        if (user is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var uploads = await dbContext.Uploads.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.Views)
            .Take(10)
            .ToListAsync(ct);

        var topUploads = new List<TopUploadAnalyticsDto>();
        foreach (var upload in uploads)
        {
            var analytics = await analyticsService.GetUploadAnalyticsAsync(upload.Id, 7, ct);
            topUploads.Add(new TopUploadAnalyticsDto(
                upload.Id,
                upload.OriginalName,
                upload.MimeType,
                upload.Size,
                upload.ShortCode,
                upload.CreatedAt,
                upload.Views,
                upload.Downloads,
                analytics.Sum(x => x.TotalViews),
                analytics.Sum(x => x.TotalDownloads),
                analytics));
        }

        var totalFiles = await dbContext.Uploads.CountAsync(x => x.UserId == userId, ct);
        var totalViews = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (int?)x.Views, ct) ?? 0;
        var totalDownloads = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (int?)x.Downloads, ct) ?? 0;
        var userAnalytics = await analyticsService.GetUserAnalyticsAsync(userId, 30, ct);

        await SendOkAsync(new AnalyticsOverviewResponse(
            new AnalyticsUserDto(
                user.Id,
                user.Email,
                user.Name,
                user.Settings?.MaxFileSize ?? 10_485_760,
                user.Settings?.MaxStorageLimit,
                user.Settings?.StorageUsed ?? 0),
            userAnalytics,
            topUploads,
            new AnalyticsSummaryDto(totalFiles, totalViews, totalDownloads)), ct);
    }
}

public sealed record AnalyticsOverviewResponse(
    AnalyticsUserDto User,
    IReadOnlyList<DailyMetricDto> UserAnalytics,
    IReadOnlyList<TopUploadAnalyticsDto> TopUploadsAnalytics,
    AnalyticsSummaryDto Summary);

public sealed record AnalyticsUserDto(string Id, string Email, string? Name, long MaxFileSize, long? MaxStorageLimit, long StorageUsed);
public sealed record AnalyticsSummaryDto(int TotalFiles, int TotalViews, int TotalDownloads);
public sealed record TopUploadAnalyticsDto(
    string Id,
    string OriginalName,
    string MimeType,
    long Size,
    string ShortCode,
    DateTimeOffset CreatedAt,
    int Views,
    int Downloads,
    int WeeklyViews,
    int WeeklyDownloads,
    IReadOnlyList<DailyMetricDto> Analytics);
