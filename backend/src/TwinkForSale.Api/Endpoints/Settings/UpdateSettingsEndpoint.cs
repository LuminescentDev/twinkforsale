using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Settings;

public class UpdateSettingsRequest
{
    // Embed settings
    public string? EmbedTitle { get; set; }
    public string? EmbedDescription { get; set; }
    public string? EmbedColor { get; set; }
    public string? EmbedAuthor { get; set; }
    public string? EmbedFooter { get; set; }
    public bool? ShowFileInfo { get; set; }
    public bool? ShowUploadDate { get; set; }

    // URL preferences
    public bool? UseCustomWords { get; set; }
    public string? CustomWords { get; set; }
    public string? UploadDomainId { get; set; }
    public string? CustomSubdomain { get; set; }

    // Default limits
    public int? DefaultExpirationDays { get; set; }
    public int? DefaultMaxViews { get; set; }
}

public class UpdateSettingsEndpoint(AppDbContext db, ILogger<UpdateSettingsEndpoint> logger) : Endpoint<UpdateSettingsRequest>
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<UpdateSettingsEndpoint> _logger = logger;

  public override void Configure()
    {
        Put("/settings");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Settings"));
    }

    public override async Task HandleAsync(UpdateSettingsRequest req, CancellationToken ct)
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

        // Update only provided fields
        if (req.EmbedTitle != null) settings.EmbedTitle = req.EmbedTitle;
        if (req.EmbedDescription != null) settings.EmbedDescription = req.EmbedDescription;
        if (req.EmbedColor != null) settings.EmbedColor = req.EmbedColor;
        if (req.EmbedAuthor != null) settings.EmbedAuthor = req.EmbedAuthor;
        if (req.EmbedFooter != null) settings.EmbedFooter = req.EmbedFooter;
        if (req.ShowFileInfo.HasValue) settings.ShowFileInfo = req.ShowFileInfo.Value;
        if (req.ShowUploadDate.HasValue) settings.ShowUploadDate = req.ShowUploadDate.Value;
        if (req.UseCustomWords.HasValue) settings.UseCustomWords = req.UseCustomWords.Value;
        if (req.CustomWords != null) settings.CustomWords = req.CustomWords;
        if (req.UploadDomainId != null) settings.UploadDomainId = req.UploadDomainId;
        if (req.CustomSubdomain != null) settings.CustomSubdomain = req.CustomSubdomain;
        if (req.DefaultExpirationDays.HasValue) settings.DefaultExpirationDays = req.DefaultExpirationDays;
        if (req.DefaultMaxViews.HasValue) settings.DefaultMaxViews = req.DefaultMaxViews;

        settings.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Settings updated for user {UserId}", userId);

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
