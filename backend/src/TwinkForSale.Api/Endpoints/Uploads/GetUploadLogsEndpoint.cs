using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Uploads;

public class UploadLogsRequest
{
    public string UploadId { get; set; } = null!;
    public int Limit { get; set; } = 100;
}

public class ViewLogDto
{
    public string Id { get; set; } = null!;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }
    public DateTime ViewedAt { get; set; }
}

public class DownloadLogDto
{
    public string Id { get; set; } = null!;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }
    public DateTime DownloadedAt { get; set; }
}

public class UploadLogsResponse
{
    public List<ViewLogDto> ViewLogs { get; set; } = [];
    public List<DownloadLogDto> DownloadLogs { get; set; } = [];
}

public class GetUploadLogsEndpoint(AppDbContext db) : Endpoint<UploadLogsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/uploads/{UploadId}/logs");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Uploads"));
    }

    public override async Task HandleAsync(UploadLogsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var upload = await _db.Uploads
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == req.UploadId, ct);

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

        var limit = Math.Clamp(req.Limit, 1, 500);

        var viewLogs = await _db.ViewLogs
            .Where(v => v.UploadId == req.UploadId)
            .OrderByDescending(v => v.ViewedAt)
            .Take(limit)
            .Select(v => new ViewLogDto
            {
                Id = v.Id,
                IpAddress = v.IpAddress,
                UserAgent = v.UserAgent,
                Referrer = v.Referrer,
                ViewedAt = v.ViewedAt
            })
            .ToListAsync(ct);

        var downloadLogs = await _db.DownloadLogs
            .Where(d => d.UploadId == req.UploadId)
            .OrderByDescending(d => d.DownloadedAt)
            .Take(limit)
            .Select(d => new DownloadLogDto
            {
                Id = d.Id,
                IpAddress = d.IpAddress,
                UserAgent = d.UserAgent,
                Referrer = d.Referer,
                DownloadedAt = d.DownloadedAt
            })
            .ToListAsync(ct);

        var response = new UploadLogsResponse
        {
            ViewLogs = viewLogs,
            DownloadLogs = downloadLogs
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
