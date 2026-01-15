using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.User;

public class CurrentUserResponse
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Name { get; set; }
    public string? Image { get; set; }
    public bool IsApproved { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserSettingsResponse? Settings { get; set; }
}

public class UserSettingsResponse
{
    public int MaxUploads { get; set; }
    public long MaxFileSize { get; set; }
    public long? MaxStorageLimit { get; set; }
    public long StorageUsed { get; set; }
    public int MaxShortLinks { get; set; }
    public string? EmbedTitle { get; set; }
    public string? EmbedColor { get; set; }
    public bool UseCustomWords { get; set; }
}

public class GetCurrentUserEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/users/me");
        AuthSchemes("JWT", "ApiKey");
        Description(x => x.WithTags("User"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var response = new CurrentUserResponse
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Image = user.Image,
            IsApproved = user.IsApproved,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
            Settings = user.Settings != null ? new UserSettingsResponse
            {
                MaxUploads = user.Settings.MaxUploads,
                MaxFileSize = user.Settings.MaxFileSize,
                MaxStorageLimit = user.Settings.MaxStorageLimit,
                StorageUsed = user.Settings.StorageUsed,
                MaxShortLinks = user.Settings.MaxShortLinks,
                EmbedTitle = user.Settings.EmbedTitle,
                EmbedColor = user.Settings.EmbedColor,
                UseCustomWords = user.Settings.UseCustomWords
            } : null
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
