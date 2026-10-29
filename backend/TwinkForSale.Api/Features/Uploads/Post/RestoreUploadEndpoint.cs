using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Post;

public sealed class RestoreUploadEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/uploads/{id}/restore");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        var cutoff = DateTimeOffset.UtcNow.AddDays(-UploadDeletion.RetentionDays);
        var changed = await db.Uploads.Where(x => x.Id == Route<string>("id", true) && x.UserId == userId && x.DeletedAt > cutoff)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.DeletedAt, (DateTimeOffset?)null), ct);
        if (changed == 0) { await SendNotFoundAsync(ct); return; }
        await tx.CommitAsync(ct);
        await SendOkAsync(new { success = true }, ct);
    }
}
