using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Admin;

public class UserUsageResponse
{
    public string UserId { get; set; } = null!;
    public string Email { get; set; } = null!;
    public int UploadCount { get; set; }
    public long StorageUsed { get; set; }
    public long MaxStorageLimit { get; set; }
    public int MaxUploads { get; set; }
}

public class UserLimitsResponse
{
    public long StorageUsed { get; set; }
    public long StorageLimit { get; set; }
    public double StorageUsagePercent { get; set; }
    public int FileCount { get; set; }
    public int FileLimit { get; set; }
    public double FileUsagePercent { get; set; }
    public bool StorageApproaching { get; set; }
    public bool FilesApproaching { get; set; }
}

public class GetUserUsageEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/users/{userId}/usage");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdParam = Route<string>("userId");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && userIdParam != userId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .Include(u => u.Uploads)
            .FirstOrDefaultAsync(u => u.Id == userIdParam, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var maxStorage = user.Settings?.MaxStorageLimit ?? 50L * 1024 * 1024 * 1024; // 50GB default
        var maxUploads = user.Settings?.MaxUploads ?? 100;

        var response = new UserUsageResponse
        {
            UserId = user.Id,
            Email = user.Email,
            UploadCount = user.Uploads.Count,
            StorageUsed = user.Settings?.StorageUsed ?? 0,
            MaxStorageLimit = maxStorage,
            MaxUploads = maxUploads
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class GetUserLimitsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/users/{userId}/limits");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdParam = Route<string>("userId");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && userIdParam != userId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .Include(u => u.Uploads)
            .FirstOrDefaultAsync(u => u.Id == userIdParam, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var storageUsed = user.Uploads.Sum(u => u.Size);
        var storageLimit = user.Settings?.MaxStorageLimit ?? 10L * 1024 * 1024 * 1024; // 10GB default
        var storageUsagePercent = storageLimit > 0 ? (double)storageUsed / storageLimit * 100 : 0;

        var fileCount = user.Uploads.Count;
        var fileLimit = user.Settings?.MaxUploads ?? 1000;
        var fileUsagePercent = fileLimit > 0 ? (double)fileCount / fileLimit * 100 : 0;

        var response = new UserLimitsResponse
        {
            StorageUsed = storageUsed,
            StorageLimit = storageLimit,
            StorageUsagePercent = storageUsagePercent,
            FileCount = fileCount,
            FileLimit = fileLimit,
            FileUsagePercent = fileUsagePercent,
            StorageApproaching = storageUsagePercent >= 80,
            FilesApproaching = fileUsagePercent >= 80
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class CheckUserStorageEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Post("/admin/users/{userId}/storage-check");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var userIdParam = Route<string>("userId");
        var user = await _db.Users
            .Include(u => u.Settings)
            .Include(u => u.Uploads)
            .FirstOrDefaultAsync(u => u.Id == userIdParam, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var totalStorage = user.Uploads.Sum(u => u.Size);
        var storageLimit = user.Settings?.MaxStorageLimit ?? 10L * 1024 * 1024 * 1024;
        var storageUsagePercent = storageLimit > 0 ? (double)totalStorage / storageLimit * 100 : 0;

        var fileCount = user.Uploads.Count;
        var fileLimit = user.Settings?.MaxUploads ?? 1000;
        var fileUsagePercent = fileLimit > 0 ? (double)fileCount / fileLimit * 100 : 0;

        if (user.Settings != null)
        {
            user.Settings.StorageUsed = totalStorage;
        }
        else
        {
            user.Settings = new UserSettings
            {
                UserId = user.Id,
                StorageUsed = totalStorage
            };
        }

        await _db.SaveChangesAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new
        {
            storageUsed = totalStorage,
            storageLimit,
            storageUsagePercent,
            fileCount,
            fileLimit,
            fileUsagePercent
        }, (JsonSerializerOptions?)null, ct);
    }
}
