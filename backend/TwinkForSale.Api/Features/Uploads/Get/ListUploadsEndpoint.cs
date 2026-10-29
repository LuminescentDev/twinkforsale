using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Get;

public sealed class ListUploadsEndpoint(AppDbContext dbContext) : Endpoint<ListUploadsRequest, ListUploadsResponse>
{
    public override void Configure()
    {
        Get("/uploads", "/dashboard/uploads");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(ListUploadsRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        if (req.Kind is not ("all" or "image" or "video" or "audio" or "document" or "archive" or "other") ||
            req.Sort is not ("date" or "name" or "size" or "views" or "downloads") ||
            req.Direction is not ("asc" or "desc") || req.Period is not ("all" or "month" or "week") ||
            req.State is not ("active" or "trash" or "expired" or "pending") || req.Page < 1 || req.PageSize is < 1 or > 100)
        {
            AddError("Invalid file filters or pagination.");
            await SendErrorsAsync(cancellation: ct);
            return;
        }

        var query = dbContext.Uploads
            .AsNoTracking()
            .Where(x => x.UserId == userId);
        var now = DateTimeOffset.UtcNow;
        query = req.State switch
        {
            "trash" => query.Where(x => x.DeletedAt != null),
            "pending" => query.Where(x => x.DeletedAt == null && x.IsPending),
            "expired" => query.Where(x => x.DeletedAt == null && !x.IsPending && (x.ExpiresAt <= now || (x.MaxViews != null && x.Views >= x.MaxViews))),
            _ => query.Where(x => x.DeletedAt == null && !x.IsPending)
        };
        var total = await query.CountAsync(ct);
        if (req.FavoritesOnly) query = query.Where(x => x.IsFavorite);
        if (!string.IsNullOrWhiteSpace(req.Tag))
        {
            var tag = req.Tag.Trim().ToLowerInvariant();
            query = query.Where(x => x.Tags.Contains(tag));
        }
        if (req.Period != "all")
        {
            var since = req.Period == "month" ? new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero) : now.AddDays(-7);
            query = query.Where(x => x.CreatedAt >= since);
        }
        var search = req.Search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(x => (x.DisplayName ?? x.OriginalName).ToLower().Contains(search) ||
                x.ShortCode.ToLower().Contains(search) || x.MimeType.ToLower().Contains(search));
        }

        if (req.Kind != "all")
        {
            query = query.Where(x =>
                (x.MimeType.ToLower().StartsWith("image/") ? "image" :
                 x.MimeType.ToLower().StartsWith("video/") ? "video" :
                 x.MimeType.ToLower().StartsWith("audio/") ? "audio" :
                 x.MimeType.ToLower().Contains("zip") || x.MimeType.ToLower().Contains("rar") ||
                 x.MimeType.ToLower().Contains("tar") || x.MimeType.ToLower().Contains("7z") ? "archive" :
                 x.MimeType.ToLower().StartsWith("text/") || x.MimeType.ToLower().Contains("pdf") ||
                 x.MimeType.ToLower().Contains("json") || x.MimeType.ToLower().Contains("xml") ||
                 x.MimeType.ToLower().Contains("document") || x.MimeType.ToLower().Contains("spreadsheet") ||
                 x.MimeType.ToLower().Contains("presentation") ? "document" : "other") == req.Kind);
        }

        var filteredTotal = await query.CountAsync(ct);
        var page = Math.Min(req.Page, Math.Max(1, (int)Math.Ceiling(filteredTotal / (double)req.PageSize)));
        var ascending = req.Direction == "asc";
        var sorted = req.Sort switch
        {
            "name" => ascending ? query.OrderBy(x => x.DisplayName ?? x.OriginalName) : query.OrderByDescending(x => x.DisplayName ?? x.OriginalName),
            "size" => ascending ? query.OrderBy(x => x.Size) : query.OrderByDescending(x => x.Size),
            "views" => ascending ? query.OrderBy(x => x.Views) : query.OrderByDescending(x => x.Views),
            "downloads" => ascending ? query.OrderBy(x => x.Downloads) : query.OrderByDescending(x => x.Downloads),
            _ => ascending ? query.OrderBy(x => x.CreatedAt) : query.OrderByDescending(x => x.CreatedAt)
        };

        var uploads = await sorted.ThenBy(x => x.Id)
            .Skip((page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(x => new UploadListItem(
                x.Id,
                x.ShortCode,
                x.DisplayName ?? x.OriginalName,
                x.MimeType,
                x.Size,
                x.Url,
                x.Views,
                x.Downloads,
                x.CreatedAt,
                x.ExpiresAt,
                x.MaxViews, x.IsFavorite, x.Tags, x.AccessMode, x.IsRevoked, x.DeletedAt, x.IsPending, x.FileRequestId))
            .ToListAsync(ct);

        await SendOkAsync(new ListUploadsResponse(uploads, total, filteredTotal, page, req.PageSize), ct);
    }
}

public sealed class ListUploadsRequest
{
    public string? Search { get; set; }
    public string Kind { get; set; } = "all";
    public string Sort { get; set; } = "date";
    public string Direction { get; set; } = "desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public string? Tag { get; set; }
    public bool FavoritesOnly { get; set; }
    public string Period { get; set; } = "all";
    public string State { get; set; } = "active";
}

public sealed record ListUploadsResponse(IReadOnlyList<UploadListItem> Uploads, int Total, int FilteredTotal, int Page, int PageSize);

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
    DateTimeOffset? ExpiresAt,
    int? MaxViews,
    bool IsFavorite, string[] Tags, string AccessMode, bool IsRevoked, DateTimeOffset? DeletedAt, bool IsPending, string? FileRequestId);
