using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;
using TwinkForSale.Api.Services.Storage;

namespace TwinkForSale.Api.Endpoints.Files;

public class ServeFileRequest
{
    public string ShortCode { get; set; } = null!;
}

public class ServeFileEndpoint(
    AppDbContext db,
    IStorageService storage,
    IConfiguration config,
    ILogger<ServeFileEndpoint> logger) : Endpoint<ServeFileRequest>
{
    private readonly AppDbContext _db = db;
    private readonly IStorageService _storage = storage;
    private readonly IConfiguration _config = config;
    private readonly ILogger<ServeFileEndpoint> _logger = logger;

    // Common bot user agents for embed detection
    private static readonly string[] BotUserAgents =
    [
        "discordbot",
        "twitterbot",
        "telegrambot",
        "facebookexternalhit",
        "slackbot",
        "linkedinbot",
        "whatsapp"
    ];

  public override void Configure()
    {
        Get("/f/{ShortCode}");
        AllowAnonymous();
        Description(x => x.WithTags("Files"));
    }

    public override async Task HandleAsync(ServeFileRequest req, CancellationToken ct)
    {
        // Handle thumbnail requests
        var isThumbnail = req.ShortCode.StartsWith("thumb_");
        var shortCode = isThumbnail ? req.ShortCode[6..] : req.ShortCode;

        // Remove extension if present
        var dotIndex = shortCode.IndexOf('.');
        if (dotIndex > 0)
        {
            shortCode = shortCode[..dotIndex];
        }

        var upload = await _db.Uploads
            .Include(u => u.User)
            .ThenInclude(u => u!.Settings)
            .FirstOrDefaultAsync(u => u.ShortCode == shortCode, ct);

        if (upload == null || !upload.IsPublic)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        // Check if this is a bot request for embed
        var userAgent = HttpContext.Request.Headers.UserAgent.ToString().ToLowerInvariant();
        var isBot = BotUserAgents.Any(bot => userAgent.Contains(bot));

        if (isBot && !isThumbnail && upload.ContentType?.StartsWith("image/") == true)
        {
            // Return HTML page with OpenGraph meta tags for better embeds
            await ServeEmbedPage(upload, ct);
            return;
        }

        // Get the appropriate path
        var storagePath = isThumbnail && !string.IsNullOrEmpty(upload.ThumbnailPath)
            ? upload.ThumbnailPath
            : upload.StoragePath;

        var stream = await _storage.GetAsync(storagePath, ct);
        if (stream == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        // Log view (non-bot only)
        if (!isBot)
        {
            await LogView(upload, ct);
        }

        // Set response headers
        var contentType = isThumbnail ? "image/jpeg" : upload.ContentType ?? "application/octet-stream";
        HttpContext.Response.ContentType = contentType;
        HttpContext.Response.Headers.CacheControl = "public, max-age=31536000";

        // Stream the file
        await stream.CopyToAsync(HttpContext.Response.Body, ct);
        await stream.DisposeAsync();
    }

    private async Task ServeEmbedPage(Entities.Upload upload, CancellationToken ct)
    {
        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5000";
        var appName = _config["App:Name"] ?? "TwinkForSale";
        var fileUrl = $"{baseUrl}/f/{upload.ShortCode}";
        var embedTitle = upload.User?.Settings?.EmbedTitle ?? upload.OriginalName;
        var embedColor = upload.User?.Settings?.EmbedColor ?? "#7289da";

        var html = $"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta property="og:title" content="{System.Web.HttpUtility.HtmlEncode(embedTitle)}">
                <meta property="og:type" content="image">
                <meta property="og:image" content="{fileUrl}">
                <meta property="og:image:width" content="{upload.Width ?? 800}">
                <meta property="og:image:height" content="{upload.Height ?? 600}">
                <meta property="og:url" content="{fileUrl}">
                <meta property="og:site_name" content="{appName}">
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:image" content="{fileUrl}">
                <meta name="theme-color" content="{embedColor}">
                <link type="application/json+oembed" href="{baseUrl}/api/oembed?url={Uri.EscapeDataString(fileUrl)}">
            </head>
            <body>
                <script>window.location.href = "{fileUrl}";</script>
            </body>
            </html>
            """;

        HttpContext.Response.ContentType = "text/html";
        await HttpContext.Response.WriteAsync(html, ct);
    }

    private async Task LogView(Entities.Upload upload, CancellationToken ct)
    {
        try
        {
            upload.ViewCount++;
            upload.LastViewedAt = DateTime.UtcNow;

            var viewLog = new ViewLog
            {
                UploadId = upload.Id,
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = HttpContext.Request.Headers.UserAgent.ToString(),
                Referrer = HttpContext.Request.Headers.Referer.ToString()
            };

            _db.ViewLogs.Add(viewLog);
            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to log view for upload {UploadId}", upload.Id);
        }
    }
}
