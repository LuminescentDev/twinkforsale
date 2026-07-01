using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Uploads.Get;

public sealed class ServeUploadEndpoint(AppDbContext dbContext, IFileStorage fileStorage) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/f/{shortCode}");
        AllowAnonymous();
        Summary(summary =>
        {
            summary.Summary = "Serves an uploaded file by short code.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var shortCode = Route<string>("shortCode");
        var upload = await dbContext.Uploads.FirstOrDefaultAsync(x => x.ShortCode == shortCode, ct);

        if (upload is null ||
            upload.ExpiresAt < DateTimeOffset.UtcNow ||
            (upload.MaxViews is not null && upload.Views >= upload.MaxViews.Value))
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var isDirect = HttpContext.Request.Query.TryGetValue("direct", out var direct) &&
            string.Equals(direct, "true", StringComparison.OrdinalIgnoreCase);
        var referrer = HttpContext.Request.Headers.Referer.ToString();
        var isInternalDashboardView = referrer.Contains("/dashboard", StringComparison.OrdinalIgnoreCase) ||
            referrer.Contains("/uploads", StringComparison.OrdinalIgnoreCase) ||
            referrer.Contains("/admin", StringComparison.OrdinalIgnoreCase);
        var ipAddress = GetClientIpAddress();
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString();

        var stream = await fileStorage.OpenReadAsync(upload.Filename, ct);
        if (stream is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        if (isDirect)
        {
            dbContext.DownloadLogs.Add(new DownloadLog
            {
                UploadId = upload.Id,
                IpAddress = ipAddress,
                UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent,
                Referer = string.IsNullOrWhiteSpace(referrer) ? null : referrer
            });
            upload.Downloads++;
            upload.LastDownloaded = DateTimeOffset.UtcNow;
        }
        else if (!isInternalDashboardView)
        {
            dbContext.ViewLogs.Add(new ViewLog
            {
                UploadId = upload.Id,
                IpAddress = ipAddress,
                UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent,
                Referer = string.IsNullOrWhiteSpace(referrer) ? null : referrer
            });
            upload.Views++;
            upload.LastViewed = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);

        await SendStreamAsync(stream, fileName: upload.OriginalName, contentType: upload.MimeType, cancellation: ct);
    }

    private string? GetClientIpAddress()
    {
        var headers = HttpContext.Request.Headers;
        var ipAddress = headers["x-forwarded-for"].FirstOrDefault()
            ?? headers["x-real-ip"].FirstOrDefault()
            ?? headers["cf-connecting-ip"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();

        return ipAddress?.Split(',')[0].Trim();
    }
}
