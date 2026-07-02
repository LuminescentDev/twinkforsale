using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Net;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Uploads.Get;

public sealed class ServeUploadEndpoint(
    AppDbContext dbContext,
    IFileStorage fileStorage,
    IOptions<AppOptions> appOptions) : EndpointWithoutRequest
{
    private static readonly string[] BotUserAgentMarkers =
    [
        "bot",
        "crawler",
        "spider",
        "crawling",
        "discord",
        "telegram",
        "whatsapp",
        "facebook",
        "twitter",
        "slack"
    ];

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
        var upload = await dbContext.Uploads
            .Include(x => x.User)
            .ThenInclude(x => x!.Settings)
            .FirstOrDefaultAsync(x => x.ShortCode == shortCode, ct);

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
        var isBotOrCrawler = IsBotOrCrawler(userAgent);

        var stream = await fileStorage.OpenReadAsync(upload.Filename, ct);
        if (stream is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        if (isDirect || !isBotOrCrawler)
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

            await dbContext.SaveChangesAsync(ct);
            await SendFileAsync(stream, upload, ct);
            return;
        }

        await stream.DisposeAsync();

        if (!isInternalDashboardView)
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

        var stats = upload.User?.Settings?.ShowUserStats == true && upload.UserId is not null
            ? await GetUserStatsAsync(upload.UserId, ct)
            : null;
        var html = GenerateDiscordEmbed(upload, stats);

        HttpContext.Response.StatusCode = StatusCodes.Status200OK;
        HttpContext.Response.ContentType = "text/html; charset=utf-8";
        HttpContext.Response.Headers.CacheControl = "public, max-age=300";
        await HttpContext.Response.WriteAsync(html, ct);
    }

    private async Task SendFileAsync(Stream stream, Upload upload, CancellationToken ct)
    {
        HttpContext.Response.StatusCode = StatusCodes.Status200OK;
        HttpContext.Response.ContentType = string.IsNullOrWhiteSpace(upload.MimeType)
            ? "application/octet-stream"
            : upload.MimeType;
        HttpContext.Response.Headers.ContentLength = stream.CanSeek ? stream.Length : upload.Size;
        HttpContext.Response.Headers.ContentDisposition = $"inline; filename=\"{EscapeHeaderValue(upload.OriginalName)}\"";
        HttpContext.Response.Headers.CacheControl = upload.MimeType.Equals("image/gif", StringComparison.OrdinalIgnoreCase)
            ? "public, max-age=31536000, immutable"
            : "public, max-age=31536000";

        if (upload.MimeType.Equals("image/gif", StringComparison.OrdinalIgnoreCase))
        {
            HttpContext.Response.Headers.XContentTypeOptions = "nosniff";
            HttpContext.Response.Headers.AcceptRanges = "bytes";
        }

        await using (stream)
        {
            await stream.CopyToAsync(HttpContext.Response.Body, ct);
        }
    }

    private string GenerateDiscordEmbed(Upload upload, UserStats? stats)
    {
        var settings = upload.User?.Settings;
        var title = ReplacePlaceholders(settings?.EmbedTitle, upload, stats) ?? "File Upload";
        var embedDescription = ReplacePlaceholders(settings?.EmbedDescription, upload, stats) ?? "Uploaded via twink.forsale";
        var embedColor = string.IsNullOrWhiteSpace(settings?.EmbedColor) ? "#8B5CF6" : settings.EmbedColor!;
        var embedAuthor = ReplacePlaceholders(settings?.EmbedAuthor, upload, stats) ?? upload.User?.Name;
        var embedFooter = ReplacePlaceholders(settings?.EmbedFooter, upload, stats) ?? "twink.forsale";
        var showFileInfo = settings?.ShowFileInfo != false;
        var showUploadDate = settings?.ShowUploadDate != false;
        var showUserStats = settings?.ShowUserStats == true;
        var baseUrl = appOptions.Value.BaseUrl.TrimEnd('/');
        var domain = string.IsNullOrWhiteSpace(settings?.CustomDomain)
            ? baseUrl.Replace("https://", "", StringComparison.OrdinalIgnoreCase).Replace("http://", "", StringComparison.OrdinalIgnoreCase)
            : settings.CustomDomain!;

        var descriptionHtml = Html(embedDescription);
        if (showFileInfo)
        {
            descriptionHtml += $"<br><br>&#128193; <strong>{Html(upload.OriginalName)}</strong><br>&#128207; {FormatBytes(upload.Size)} &bull; {Html(upload.MimeType)}";
        }

        if (showUploadDate)
        {
            descriptionHtml += $"<br>&#128197; Uploaded {Html(upload.CreatedAt.ToLocalTime().ToString("d"))}";
        }

        if (showUserStats && stats is not null)
        {
            descriptionHtml += $"<br><br>&#128100; <strong>User Stats</strong><br>&#128202; {stats.TotalFiles} files uploaded &bull; {FormatBytes(stats.TotalStorage)} used<br>&#128064; {stats.TotalViews:N0} total views";
        }

        var plainDescription = embedDescription;
        if (showFileInfo)
        {
            plainDescription += $"\n{upload.OriginalName}\n{FormatBytes(upload.Size)} - {upload.MimeType}";
        }

        if (showUploadDate)
        {
            plainDescription += $"\nUploaded {upload.CreatedAt.ToLocalTime():d}";
        }

        var directUrl = $"{upload.Url}?direct=true";
        var preview = upload.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
            ? $"<img src=\"{Attr(directUrl)}\" alt=\"{Attr(upload.OriginalName)}\" />"
            : "<div style=\"font-size: 48px; margin-bottom: 16px;\">&#128196;</div>";
        var authorMeta = string.IsNullOrWhiteSpace(embedAuthor)
            ? string.Empty
            : $"<meta name=\"author\" content=\"{Attr(embedAuthor)}\">";
        var footer = string.IsNullOrWhiteSpace(embedFooter)
            ? string.Empty
            : $"<p style=\"color: #666; font-size: 12px; margin-top: 24px;\">{Html(embedFooter)}</p>";

        return $$"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{Html(title)}}</title>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="{{Attr(domain)}}">
  <meta property="og:title" content="{{Attr(title)}}">
  <meta property="og:description" content="{{Attr(plainDescription)}}">
  <meta property="og:url" content="{{Attr(directUrl)}}">
  <meta name="theme-color" content="{{Attr(embedColor)}}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{Attr(title)}}">
  <meta name="twitter:description" content="{{Attr(plainDescription)}}">
  <meta property="og:image" content="{{Attr(directUrl)}}">
  <meta property="og:image:width" content="{{upload.Width ?? 498}}">
  <meta property="og:image:height" content="{{upload.Height ?? 498}}">
  <meta name="twitter:image" content="{{Attr(directUrl)}}">
  <meta name="twitter:image:alt" content="{{Attr(title)}}">
  {{authorMeta}}
  <link rel="alternate" href="{{Attr($"{baseUrl}/api/oembed?url={Uri.EscapeDataString(upload.Url)}")}}" type="application/json+oembed" title="{{Attr(title)}}">
  <script>
    const userAgent = navigator.userAgent.toLowerCase();
    const isBotOrCrawler = /bot|crawler|spider|crawling|discord|telegram|whatsapp|facebook|twitter|slack/i.test(userAgent);
    if (!isBotOrCrawler) {
      window.location.href = '{{directUrl}}';
    }
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #1a1a1a; color: #ffffff; margin: 0; padding: 20px; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { max-width: 600px; text-align: center; }
    .file-preview { background: #2a2a2a; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .file-info { color: #aaa; font-size: 14px; margin-top: 12px; }
    .download-btn { display: inline-block; background: {{embedColor}}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px; transition: opacity 0.2s; }
    .download-btn:hover { opacity: 0.8; }
    img { max-width: 100%; max-height: 400px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>{{Html(title)}}</h1>
    <p style="color: #ccc; margin-bottom: 20px;">{{descriptionHtml}}</p>
    <div class="file-preview">
      {{preview}}
      <div class="file-info">
        <strong>{{Html(upload.OriginalName)}}</strong><br>
        {{FormatBytes(upload.Size)}} &bull; {{Html(upload.MimeType)}}<br>
        {{upload.Views}} views - {{upload.Downloads}} downloads
      </div>
    </div>
    <a href="{{Attr(directUrl)}}" class="download-btn">Download File</a>
    {{footer}}
  </div>
</body>
</html>
""";
    }

    private async Task<UserStats> GetUserStatsAsync(string userId, CancellationToken ct)
    {
        var totalFiles = await dbContext.Uploads.CountAsync(x => x.UserId == userId, ct);
        var totalStorage = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (long?)x.Size, ct) ?? 0;
        var totalViews = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (int?)x.Views, ct) ?? 0;
        return new UserStats(totalFiles, totalStorage, totalViews);
    }

    private static bool IsBotOrCrawler(string userAgent)
    {
        return BotUserAgentMarkers.Any(marker => userAgent.Contains(marker, StringComparison.OrdinalIgnoreCase));
    }

    private static string? ReplacePlaceholders(string? value, Upload upload, UserStats? stats)
    {
        if (string.IsNullOrWhiteSpace(value)) return value;

        return value
            .Replace("{filename}", upload.OriginalName, StringComparison.Ordinal)
            .Replace("{filesize}", FormatBytes(upload.Size), StringComparison.Ordinal)
            .Replace("{filetype}", upload.MimeType, StringComparison.Ordinal)
            .Replace("{uploaddate}", upload.CreatedAt.ToLocalTime().ToString("d"), StringComparison.Ordinal)
            .Replace("{views}", upload.Views.ToString(), StringComparison.Ordinal)
            .Replace("{totalfiles}", (stats?.TotalFiles ?? 0).ToString(), StringComparison.Ordinal)
            .Replace("{totalstorage}", FormatBytes(stats?.TotalStorage ?? 0), StringComparison.Ordinal)
            .Replace("{totalviews}", (stats?.TotalViews ?? 0).ToString("N0"), StringComparison.Ordinal)
            .Replace("{username}", upload.User?.Name ?? "Anonymous", StringComparison.Ordinal);
    }

    private static string FormatBytes(long bytes)
    {
        string[] sizes = ["B", "KB", "MB", "GB", "TB"];
        double len = bytes;
        var order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len /= 1024;
        }

        return $"{len:0.##} {sizes[order]}";
    }

    private static string Html(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    private static string Attr(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);

    private static string EscapeHeaderValue(string value) => value.Replace("\"", "'", StringComparison.Ordinal);

    private string? GetClientIpAddress()
    {
        var headers = HttpContext.Request.Headers;
        var ipAddress = headers["x-forwarded-for"].FirstOrDefault()
            ?? headers["x-real-ip"].FirstOrDefault()
            ?? headers["cf-connecting-ip"].FirstOrDefault()
            ?? HttpContext.Connection.RemoteIpAddress?.ToString();

        return ipAddress?.Split(',')[0].Trim();
    }

    private sealed record UserStats(int TotalFiles, long TotalStorage, int TotalViews);
}
