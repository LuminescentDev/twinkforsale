using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Features.Analytics;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Admin.Get;

public sealed class AdminAnalyticsEndpoint(AppDbContext dbContext, AnalyticsService analyticsService) : EndpointWithoutRequest<AdminAnalyticsResponse>
{
    public override void Configure()
    {
        Get("/api/admin/analytics");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var analytics = await analyticsService.GetGlobalAnalyticsAsync(30, ct);
        var totalUsers = await dbContext.Users.CountAsync(ct);
        var approvedUsers = await dbContext.Users.CountAsync(x => x.IsApproved, ct);
        var totalUploads = await dbContext.Uploads.CountAsync(ct);
        var totalStorage = await dbContext.Uploads.SumAsync(x => (long?)x.Size, ct) ?? 0;
        var totalViews = await dbContext.Uploads.SumAsync(x => (int?)x.Views, ct) ?? 0;
        var totalDownloads = await dbContext.Uploads.SumAsync(x => (int?)x.Downloads, ct) ?? 0;
        var totalShortLinks = await dbContext.ShortLinks.CountAsync(ct);
        var activeApiKeys = await dbContext.ApiKeys.CountAsync(x => x.IsActive, ct);

        await SendOkAsync(new AdminAnalyticsResponse(
            analytics,
            new AdminAnalyticsSummaryDto(totalUsers, approvedUsers, totalUploads, totalStorage, totalViews, totalDownloads, totalShortLinks, activeApiKeys)), ct);
    }
}

public sealed record AdminAnalyticsResponse(IReadOnlyList<DailyMetricDto> Analytics, AdminAnalyticsSummaryDto Summary);
public sealed record AdminAnalyticsSummaryDto(int TotalUsers, int ApprovedUsers, int TotalUploads, long TotalStorage, int TotalViews, int TotalDownloads, int TotalShortLinks, int ActiveApiKeys);
