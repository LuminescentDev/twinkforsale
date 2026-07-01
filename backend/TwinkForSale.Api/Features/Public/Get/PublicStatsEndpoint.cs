using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Features.Analytics;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Public.Get;

public sealed class PublicStatsEndpoint(AppDbContext dbContext, AnalyticsService analyticsService) : EndpointWithoutRequest<PublicStatsResponse>
{
    public override void Configure()
    {
        Get("/api/public/stats");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var totalUploads = await dbContext.Uploads.CountAsync(ct);
        var totalViews = await dbContext.Uploads.SumAsync(x => (long)x.Views, ct);
        var totalUsers = await dbContext.Users.CountAsync(ct);

        var since = DateTimeOffset.UtcNow.AddDays(-7);
        var weeklyViews = await dbContext.ViewLogs.CountAsync(x => x.ViewedAt >= since, ct);
        var weeklyUploads = await dbContext.Uploads.CountAsync(x => x.CreatedAt >= since, ct);
        var weeklyUsers = await dbContext.Users.CountAsync(x => x.CreatedAt >= since, ct);

        var analytics = await analyticsService.GetGlobalAnalyticsAsync(30, ct);
        var recentUploads = await dbContext.Uploads.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(6)
            .Select(x => new RecentUploadDto(x.Id, x.CreatedAt, x.MimeType, x.Views))
            .ToListAsync(ct);

        await SendOkAsync(new PublicStatsResponse(
            totalUploads,
            totalViews,
            totalUsers,
            new WeeklyStatsDto(weeklyViews, weeklyUploads, weeklyUsers),
            analytics.Select(x => new PublicStatsDayDto(x.Date, x.TotalViews, x.UploadsCount, x.UsersRegistered)).ToList(),
            recentUploads), ct);
    }
}

public sealed record PublicStatsResponse(
    int TotalUploads,
    long TotalViews,
    int TotalUsers,
    WeeklyStatsDto WeeklyStats,
    IReadOnlyList<PublicStatsDayDto> AnalyticsData,
    IReadOnlyList<RecentUploadDto> RecentUploads);

public sealed record WeeklyStatsDto(int Views, int Uploads, int Users);

public sealed record PublicStatsDayDto(string Date, int TotalViews, int UploadsCount, int UsersRegistered);

public sealed record RecentUploadDto(string Id, DateTimeOffset CreatedAt, string MimeType, int Views);
