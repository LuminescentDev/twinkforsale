using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Uploads;

public class UploadByShortCodeRequest
{
    public string ShortCode { get; set; } = null!;
}

public class UploadByShortCodeResponse
{
    public string Id { get; set; } = null!;
    public string ShortCode { get; set; } = null!;
    public string OriginalName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long Size { get; set; }
    public int ViewCount { get; set; }
    public int DownloadCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string UserId { get; set; } = null!;
    public string? UserEmail { get; set; }
}

public class GetUploadByShortCodeEndpoint(AppDbContext db) : Endpoint<UploadByShortCodeRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/uploads/short/{ShortCode}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Uploads"));
    }

    public override async Task HandleAsync(UploadByShortCodeRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var upload = await _db.Uploads
            .Include(u => u.User)
            .FirstOrDefaultAsync(u => u.ShortCode == req.ShortCode, ct);

        if (upload == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && upload.UserId != userId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var response = new UploadByShortCodeResponse
        {
            Id = upload.Id,
            ShortCode = upload.ShortCode,
            OriginalName = upload.OriginalName,
            ContentType = upload.ContentType,
            Size = upload.Size,
            ViewCount = upload.ViewCount,
            DownloadCount = upload.DownloadCount,
            CreatedAt = upload.CreatedAt,
            UserId = upload.UserId ?? string.Empty,
            UserEmail = upload.User?.Email
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
