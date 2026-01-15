using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Uploads;

public class ListUploadsRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
}

public class UploadDto
{
    public string Id { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string OriginalName { get; set; } = null!;
    public string ShortCode { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long Size { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string Url { get; set; } = null!;
    public int ViewCount { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ListUploadsResponse
{
    public List<UploadDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class ListUploadsEndpoint(AppDbContext db, IConfiguration config) : Endpoint<ListUploadsRequest>
{
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _config = config;

  public override void Configure()
    {
        Get("/uploads");
        AuthSchemes("JWT", "ApiKey");
        Description(x => x.WithTags("Uploads"));
    }

    public override async Task HandleAsync(ListUploadsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var query = _db.Uploads
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

        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5000";

        var items = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(u => new UploadDto
            {
                Id = u.Id,
                FileName = u.FileName,
                OriginalName = u.OriginalName,
                ShortCode = u.ShortCode,
                ContentType = u.ContentType,
                Size = u.Size,
                Width = u.Width,
                Height = u.Height,
                ThumbnailUrl = u.ThumbnailPath != null ? $"{baseUrl}/f/thumb_{u.ShortCode}" : null,
                Url = $"{baseUrl}/f/{u.ShortCode}",
                ViewCount = u.ViewCount,
                IsPublic = u.IsPublic,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync(ct);

        var response = new ListUploadsResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = req.Page,
            PageSize = req.PageSize,
            TotalPages = totalPages
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
