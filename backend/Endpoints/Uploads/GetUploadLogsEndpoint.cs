using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Uploads;

public record UploadLogsRequest(string UploadId, int Limit = 100);

public record ViewLogDto(
    string Id,
    string? IpAddress,
    string? UserAgent,
    string? Referrer,
    DateTime ViewedAt);

public record DownloadLogDto(
    string Id,
    string? IpAddress,
    string? UserAgent,
    string? Referrer,
    DateTime DownloadedAt);

public record UploadLogsResponse(
    List<ViewLogDto> ViewLogs,
    List<DownloadLogDto> DownloadLogs);

public class GetUploadLogsEndpoint(AppDbContext db) : Endpoint<UploadLogsRequest, UploadLogsResponse>
{
    public override void Configure()
    {
        Get("/uploads/{UploadId}/logs");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(UploadLogsRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var upload = await db.Uploads
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == req.UploadId, ct);

        if (upload == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && upload.UserId != userId)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        var limit = Math.Clamp(req.Limit, 1, 500);

        var viewLogs = await db.ViewLogs
            .Where(v => v.UploadId == req.UploadId)
            .OrderByDescending(v => v.ViewedAt)
            .Take(limit)
            .Select(v => new ViewLogDto(
                v.Id,
                v.IpAddress,
                v.UserAgent,
                v.Referrer,
                v.ViewedAt))
            .ToListAsync(ct);

        var downloadLogs = await db.DownloadLogs
            .Where(d => d.UploadId == req.UploadId)
            .OrderByDescending(d => d.DownloadedAt)
            .Take(limit)
            .Select(d => new DownloadLogDto(
                d.Id,
                d.IpAddress,
                d.UserAgent,
                d.Referer,
                d.DownloadedAt))
            .ToListAsync(ct);

        var response = new UploadLogsResponse(viewLogs, downloadLogs);

        await SendAsync(response, cancellation: ct);
    }
}
