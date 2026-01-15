using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Settings;

public class UserSettingsDto
{
    // Limits
    public int MaxUploads { get; set; }
    public long MaxFileSize { get; set; }
    public long? MaxStorageLimit { get; set; }
    public long StorageUsed { get; set; }
    public int MaxShortLinks { get; set; }

    // Embed settings
    public string? EmbedTitle { get; set; }
    public string? EmbedDescription { get; set; }
    public string? EmbedColor { get; set; }
    public string? EmbedAuthor { get; set; }
    public string? EmbedFooter { get; set; }
    public bool ShowFileInfo { get; set; }
    public bool ShowUploadDate { get; set; }

    // URL preferences
    public bool UseCustomWords { get; set; }
    public string? CustomWords { get; set; }
    public string? CustomDomain { get; set; }
    public string? UploadDomainId { get; set; }
    public string? CustomSubdomain { get; set; }

    // Default limits
    public int? DefaultExpirationDays { get; set; }
    public int? DefaultMaxViews { get; set; }
}

public class GetSettingsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/settings");
        AuthSchemes("JWT", "ApiKey");
        Description(x => x.WithTags("Settings"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var settings = await _db.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);

        if (settings == null)
        {
            HttpContext.Response.StatusCode = 404;
            await HttpContext.Response.WriteAsync("Settings not found", ct);
            return;
        }

        var response = new UserSettingsDto
        {
            MaxUploads = settings.MaxUploads,
            MaxFileSize = settings.MaxFileSize,
            MaxStorageLimit = settings.MaxStorageLimit,
            StorageUsed = settings.StorageUsed,
            MaxShortLinks = settings.MaxShortLinks,
            EmbedTitle = settings.EmbedTitle,
            EmbedDescription = settings.EmbedDescription,
            EmbedColor = settings.EmbedColor,
            EmbedAuthor = settings.EmbedAuthor,
            EmbedFooter = settings.EmbedFooter,
            ShowFileInfo = settings.ShowFileInfo,
            ShowUploadDate = settings.ShowUploadDate,
            UseCustomWords = settings.UseCustomWords,
            CustomWords = settings.CustomWords,
            CustomDomain = settings.CustomDomain,
            UploadDomainId = settings.UploadDomainId,
            CustomSubdomain = settings.CustomSubdomain,
            DefaultExpirationDays = settings.DefaultExpirationDays,
            DefaultMaxViews = settings.DefaultMaxViews
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
