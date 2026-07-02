using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Get;

public sealed class ListUploadsEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ListUploadsResponse>
{
    public override void Configure()
    {
        Get("/uploads", "/dashboard/uploads");
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

        var uploads = await dbContext.Uploads
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new UploadListItem(
                x.Id,
                x.ShortCode,
                x.OriginalName,
                x.MimeType,
                x.Size,
                x.Url,
                x.Views,
                x.Downloads,
                x.CreatedAt,
                x.ExpiresAt))
            .ToListAsync(ct);

        await SendOkAsync(new ListUploadsResponse(uploads), ct);
    }
}

public sealed record ListUploadsResponse(IReadOnlyList<UploadListItem> Uploads);

public sealed record UploadListItem(
    string Id,
    string ShortCode,
    string OriginalName,
    string MimeType,
    long Size,
    string Url,
    int Views,
    int Downloads,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ExpiresAt);
