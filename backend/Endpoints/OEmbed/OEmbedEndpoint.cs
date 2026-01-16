using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.OEmbed;

public class OEmbedRequest
{
    public string Url { get; set; } = null!;
    public string? Format { get; set; }
    public int? MaxWidth { get; set; }
    public int? MaxHeight { get; set; }
}

public class OEmbedResponse
{
    public string Version { get; set; } = "1.0";
    public string Type { get; set; } = null!;
    public string? Title { get; set; }
    public string? ProviderName { get; set; }
    public string? ProviderUrl { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? Url { get; set; }
    public string? Html { get; set; }
    public string? ThumbnailUrl { get; set; }
    public int? ThumbnailWidth { get; set; }
    public int? ThumbnailHeight { get; set; }
}

public class OEmbedEndpoint(AppDbContext db, IConfiguration config) : Endpoint<OEmbedRequest>
{
    private readonly AppDbContext _db = db;
    private readonly IConfiguration _config = config;

  public override void Configure()
    {
        Get("/oembed");
        AllowAnonymous();
        Description(x => x.WithTags("OEmbed"));
    }

    public override async Task HandleAsync(OEmbedRequest req, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(req.Url))
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("URL parameter is required", ct);
            return;
        }

        // Extract short code from URL
        var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:5000";
        var shortCode = ExtractShortCode(req.Url, baseUrl);

        if (string.IsNullOrEmpty(shortCode))
        {
            HttpContext.Response.StatusCode = 404;
            await HttpContext.Response.WriteAsync("Resource not found", ct);
            return;
        }

        var upload = await _db.Uploads
            .Include(u => u.User)
            .ThenInclude(u => u!.Settings)
            .FirstOrDefaultAsync(u => u.ShortCode == shortCode && u.IsPublic, ct);

        if (upload == null)
        {
            HttpContext.Response.StatusCode = 404;
            await HttpContext.Response.WriteAsync("Resource not found", ct);
            return;
        }

        var providerName = _config["App:Name"] ?? "TwinkForSale";
        var response = new OEmbedResponse
        {
            ProviderName = providerName,
            ProviderUrl = baseUrl
        };

        // Determine type based on content type
        if (upload.ContentType?.StartsWith("image/") == true)
        {
            response.Type = "photo";
            response.Url = $"{baseUrl}/f/{shortCode}";
            response.Width = upload.Width ?? req.MaxWidth ?? 800;
            response.Height = upload.Height ?? req.MaxHeight ?? 600;

            // Apply max dimensions
            if (req.MaxWidth.HasValue && response.Width > req.MaxWidth)
            {
                var ratio = (double)req.MaxWidth.Value / response.Width.Value;
                response.Width = req.MaxWidth.Value;
                response.Height = (int)(response.Height.Value * ratio);
            }
            if (req.MaxHeight.HasValue && response.Height > req.MaxHeight)
            {
                var ratio = (double)req.MaxHeight.Value / response.Height.Value;
                response.Height = req.MaxHeight.Value;
                response.Width = (int)(response.Width.Value * ratio);
            }
        }
        else if (upload.ContentType?.StartsWith("video/") == true)
        {
            response.Type = "video";
            response.Width = upload.Width ?? 800;
            response.Height = upload.Height ?? 450;
            response.Html = $"<video src=\"{baseUrl}/f/{shortCode}\" width=\"{response.Width}\" height=\"{response.Height}\" controls></video>";
        }
        else
        {
            response.Type = "link";
            response.Title = upload.OriginalName;
        }

        // Add custom embed title if set
        if (!string.IsNullOrEmpty(upload.User?.Settings?.EmbedTitle))
        {
            response.Title = upload.User.Settings.EmbedTitle;
        }

        // Add thumbnail if available
        if (!string.IsNullOrEmpty(upload.ThumbnailPath))
        {
            response.ThumbnailUrl = $"{baseUrl}/f/thumb_{shortCode}";
            response.ThumbnailWidth = 200;
            response.ThumbnailHeight = 200;
        }

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }

    private static string? ExtractShortCode(string url, string baseUrl)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return null;
        }

        // Match /f/{shortCode} pattern
        var path = uri.AbsolutePath;
        if (path.StartsWith("/f/"))
        {
            return path[3..].Split('.')[0];
        }

        return null;
    }
}
