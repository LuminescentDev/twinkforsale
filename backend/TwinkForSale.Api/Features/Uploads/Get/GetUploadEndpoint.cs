using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Get;

public sealed class GetUploadEndpoint(AppDbContext db) : EndpointWithoutRequest<UploadListItem>
{
    public override void Configure() { Get("/uploads/{id}"); AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser); }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id"); var userId = User.GetUserId();
        var x = await db.Uploads.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (x is null) { await SendNotFoundAsync(ct); return; }
        await SendOkAsync(new UploadListItem(x.Id, x.ShortCode, x.DisplayName ?? x.OriginalName, x.MimeType, x.Size, x.Url, x.Views, x.Downloads,
            x.CreatedAt, x.ExpiresAt, x.MaxViews, x.IsFavorite, x.Tags, x.AccessMode, x.IsRevoked, x.DeletedAt, x.IsPending, x.FileRequestId), ct);
    }
}
