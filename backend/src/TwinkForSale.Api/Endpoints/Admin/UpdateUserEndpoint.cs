using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class UpdateUserRequest
{
    public string Id { get; set; } = null!;
    public bool? IsApproved { get; set; }
    public bool? IsAdmin { get; set; }
    public int? MaxUploads { get; set; }
    public long? MaxFileSize { get; set; }
    public long? MaxStorageLimit { get; set; }
    public int? MaxShortLinks { get; set; }
}

public class UpdateUserEndpoint : Endpoint<UpdateUserRequest>
{
    private readonly AppDbContext _db;
    private readonly ILogger<UpdateUserEndpoint> _logger;

    public UpdateUserEndpoint(AppDbContext db, ILogger<UpdateUserEndpoint> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override void Configure()
    {
        Put("/admin/users/{Id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(UpdateUserRequest req, CancellationToken ct)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.FindFirstValue("isAdmin");

        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == req.Id, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        // Update user fields
        if (req.IsApproved.HasValue && req.IsApproved.Value != user.IsApproved)
        {
            user.IsApproved = req.IsApproved.Value;
            if (req.IsApproved.Value)
            {
                user.ApprovedAt = DateTime.UtcNow;
                user.ApprovedById = adminUserId;
            }
        }

        if (req.IsAdmin.HasValue)
        {
            user.IsAdmin = req.IsAdmin.Value;
        }

        // Update settings if provided
        if (user.Settings != null)
        {
            if (req.MaxUploads.HasValue) user.Settings.MaxUploads = req.MaxUploads.Value;
            if (req.MaxFileSize.HasValue) user.Settings.MaxFileSize = req.MaxFileSize.Value;
            if (req.MaxStorageLimit.HasValue) user.Settings.MaxStorageLimit = req.MaxStorageLimit.Value;
            if (req.MaxShortLinks.HasValue) user.Settings.MaxShortLinks = req.MaxShortLinks.Value;
            user.Settings.UpdatedAt = DateTime.UtcNow;
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("User {UserId} updated by admin {AdminId}", req.Id, adminUserId);

        var response = new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Name = user.Name,
            Image = user.Image,
            IsApproved = user.IsApproved,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
            ApprovedAt = user.ApprovedAt,
            ApprovedById = user.ApprovedById,
            UploadCount = await _db.Uploads.CountAsync(u => u.UserId == user.Id, ct),
            StorageUsed = user.Settings?.StorageUsed ?? 0
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
