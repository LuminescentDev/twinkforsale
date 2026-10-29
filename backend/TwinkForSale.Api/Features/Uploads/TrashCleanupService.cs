using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads;

public sealed class TrashCleanupService(IServiceScopeFactory scopes, ILogger<TrashCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopes.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var deletion = scope.ServiceProvider.GetRequiredService<UploadDeletion>();
                var cutoff = DateTimeOffset.UtcNow.AddDays(-UploadDeletion.RetentionDays);
                var expired = await db.Uploads.AsNoTracking().Where(x => x.DeletedAt <= cutoff)
                    .Select(x => new { x.Id, x.UserId }).Take(500).ToListAsync(stoppingToken);
                foreach (var item in expired) await deletion.DeleteAsync(item.Id, item.UserId, stoppingToken, deletedBefore: cutoff);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Trash cleanup failed; will retry on the next pass."); }
            if (!await timer.WaitForNextTickAsync(stoppingToken)) break;
        }
    }
}
