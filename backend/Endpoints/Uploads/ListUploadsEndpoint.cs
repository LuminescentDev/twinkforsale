using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Uploads;

public record ListUploadsRequest(int Page = 1, int PageSize = 20, string? Search = null);

public record UploadDto(
    string Id,
    string FileName,
    string OriginalName,
    string ShortCode,
    string ContentType,
    long Size,
    int? Width,
    int? Height,
    string? ThumbnailUrl,
    string Url,
    int ViewCount,
    bool IsPublic,
    DateTime CreatedAt);

public record ListUploadsResponse(
    List<UploadDto> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);

public class ListUploadsEndpoint(AppDbContext db, IConfiguration config) : Endpoint<ListUploadsRequest, ListUploadsResponse>
{
    public override void Configure()
    {
        Get("/uploads");
        AuthSchemes("JWT", "ApiKey");
    }

    public override async Task HandleAsync(ListUploadsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var query = db.Uploads
            .Where(u => u.UserId == userId)
            .OrderByDescending(u => u.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrEmpty(req.Search))
        {
            query = query.Where(u =>
                u.OriginalName.Contains(req.Search) ||
                u.ShortCode.Contains(req.Search));
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);

        var baseUrl = config["App:BaseUrl"] ?? "http://localhost:5000";

        var items = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(u => new UploadDto(
                u.Id,
                u.FileName,
                u.OriginalName,
                u.ShortCode,
                u.ContentType,
                u.Size,
                u.Width,
                u.Height,
                u.ThumbnailPath != null ? $"{baseUrl}/f/thumb_{u.ShortCode}" : null,
                $"{baseUrl}/f/{u.ShortCode}",
                u.ViewCount,
                u.IsPublic,
                u.CreatedAt))
            .ToListAsync(ct);

        var response = new ListUploadsResponse(
            items,
            totalCount,
            req.Page,
            req.PageSize,
            totalPages);

        await SendAsync(response, cancellation: ct);
    }
}
