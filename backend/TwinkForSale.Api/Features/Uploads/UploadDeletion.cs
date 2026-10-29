using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Uploads;

public sealed class UploadDeletion(AppDbContext dbContext, IFileStorage fileStorage)
{
    public const int RetentionDays = 30;

    public async Task<bool> DeleteAsync(string id, string? userId, CancellationToken ct, bool permanent = true, DateTimeOffset? deletedBefore = null)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
        if (userId is not null)
        {
            await dbContext.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        }
        var upload = await dbContext.Uploads.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (upload is null) return false;
        if (deletedBefore is not null && (upload.DeletedAt is null || upload.DeletedAt > deletedBefore)) return false;

        if (!permanent)
        {
            upload.DeletedAt ??= DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return true;
        }

        await fileStorage.DeleteAsync(upload.Filename, ct);
        await dbContext.UserSettings.Where(x => x.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.StorageUsed, x => x.StorageUsed >= upload.Size ? x.StorageUsed - upload.Size : 0), ct);
        dbContext.Uploads.Remove(upload);
        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
        return true;
    }
}
