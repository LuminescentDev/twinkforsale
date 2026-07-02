using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.OEmbed.Get;

public sealed class OEmbedEndpoint(AppDbContext dbContext, IOptions<AppOptions> appOptions) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/oembed", "/api/oembed");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var requestUrl = Query<string>("url", isRequired: false);
        if (string.IsNullOrWhiteSpace(requestUrl))
        {
            await SendAsync(new { error = "URL parameter is required" }, StatusCodes.Status400BadRequest, ct);
            return;
        }

        var shortCode = ExtractShortCode(requestUrl);
        if (string.IsNullOrWhiteSpace(shortCode))
        {
            await SendAsync(new { error = "Invalid URL format" }, StatusCodes.Status400BadRequest, ct);
            return;
        }

        var upload = await dbContext.Uploads.AsNoTracking()
            .Include(x => x.User)
            .ThenInclude(x => x!.Settings)
            .FirstOrDefaultAsync(x => x.ShortCode == shortCode, ct);

        if (upload is null)
        {
            await SendAsync(new { error = "Upload not found" }, StatusCodes.Status404NotFound, ct);
            return;
        }

        var settings = upload.User?.Settings;
        var userStats = settings?.ShowUserStats == true && upload.UserId is not null
            ? await GetUserStatsAsync(upload.UserId, ct)
            : null;

        var title = ReplacePlaceholders(settings?.EmbedTitle, upload, userStats, upload.User?.Name) ?? "File Upload";
        var author = ReplacePlaceholders(settings?.EmbedAuthor, upload, userStats, upload.User?.Name) ?? upload.User?.Name;
        var providerName = ReplacePlaceholders(settings?.EmbedFooter, upload, userStats, upload.User?.Name) ?? "twink.forsale";

        if (settings?.ShowUserStats == true && userStats is not null)
        {
            providerName = $"{userStats.TotalFiles} files - {FormatBytes(userStats.TotalStorage)} - {userStats.TotalViews:N0} views";
        }

        var response = new Dictionary<string, object?>
        {
            ["version"] = "1.0",
            ["type"] = "rich",
            ["title"] = title,
            ["provider_name"] = providerName,
            ["provider_url"] = appOptions.Value.BaseUrl.TrimEnd('/'),
            ["width"] = 400,
            ["height"] = 300
        };

        if (!string.IsNullOrWhiteSpace(author))
        {
            response["author_name"] = author;
            response["author_url"] = requestUrl;
        }

        if (upload.MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            response["thumbnail_url"] = $"{upload.Url}?direct=true";
            response["thumbnail_width"] = upload.Width ?? 400;
            response["thumbnail_height"] = upload.Height ?? 300;

            if (upload.MimeType.Equals("image/gif", StringComparison.OrdinalIgnoreCase))
            {
                response["type"] = "video";
                response["html"] = $"<img src=\"{upload.Url}?direct=true\" alt=\"{System.Net.WebUtility.HtmlEncode(title)}\" style=\"max-width:100%;height:auto;\" />";
                response["width"] = upload.Width ?? 400;
                response["height"] = upload.Height ?? 300;
            }
        }

        await SendAsync(response, cancellation: ct);
    }

    private async Task<UserStats?> GetUserStatsAsync(string userId, CancellationToken ct)
    {
        var totalFiles = await dbContext.Uploads.CountAsync(x => x.UserId == userId, ct);
        var totalStorage = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (long?)x.Size, ct) ?? 0;
        var totalViews = await dbContext.Uploads.Where(x => x.UserId == userId).SumAsync(x => (int?)x.Views, ct) ?? 0;
        return new UserStats(totalFiles, totalStorage, totalViews);
    }

    private static string? ExtractShortCode(string requestUrl)
    {
        if (!Uri.TryCreate(requestUrl, UriKind.Absolute, out var uri)) return null;
        var parts = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length >= 2 && parts[0] == "f" ? parts[1] : null;
    }

    private static string? ReplacePlaceholders(string? value, Domain.Entities.Upload upload, UserStats? stats, string? username)
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
            .Replace("{username}", username ?? "Anonymous", StringComparison.Ordinal);
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

    private sealed record UserStats(int TotalFiles, long TotalStorage, int TotalViews);
}
