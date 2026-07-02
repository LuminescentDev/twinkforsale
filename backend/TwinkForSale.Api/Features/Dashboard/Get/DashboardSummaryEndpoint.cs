using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Dashboard.Get;

public sealed class DashboardSummaryEndpoint(AppDbContext dbContext, IOptions<AppOptions> appOptions) : EndpointWithoutRequest<DashboardSummaryResponse>
{
    public override void Configure()
    {
        Get("/dashboard/summary");
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

        var user = await dbContext.Users
            .AsNoTracking()
            .Include(x => x.Settings)
            .FirstOrDefaultAsync(x => x.Id == userId, ct);

        if (user is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var totalUploads = await dbContext.Uploads.CountAsync(x => x.UserId == userId, ct);
        var totalViews = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (int?)x.Views, ct) ?? 0;
        var totalDownloads = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (int?)x.Downloads, ct) ?? 0;
        var shortLinks = await dbContext.ShortLinks.CountAsync(x => x.UserId == userId, ct);
        var storageUsed = user.Settings?.StorageUsed ?? 0;
        var storageLimit = user.Settings?.MaxStorageLimit ?? appOptions.Value.BaseStorageLimit;

        await SendOkAsync(new DashboardSummaryResponse(
            totalUploads,
            totalViews,
            totalDownloads,
            shortLinks,
            storageUsed,
            storageLimit), ct);
    }
}

public sealed record DashboardSummaryResponse(
    int TotalUploads,
    int TotalViews,
    int TotalDownloads,
    int ShortLinks,
    long StorageUsed,
    long StorageLimit);
