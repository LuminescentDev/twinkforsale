using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class AdminUserDto
{
    public string Id { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Name { get; set; }
    public string? Image { get; set; }
    public bool IsApproved { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedById { get; set; }
    public int UploadCount { get; set; }
    public long StorageUsed { get; set; }
}

public class ListUsersRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public bool? IsApproved { get; set; }
}

public class ListUsersResponse
{
    public List<AdminUserDto> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class ListUsersEndpoint : Endpoint<ListUsersRequest>
{
    private readonly AppDbContext _db;

    public ListUsersEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Get("/admin/users");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(ListUsersRequest req, CancellationToken ct)
    {
        // Check admin role
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var query = _db.Users
            .Include(u => u.Settings)
            .OrderByDescending(u => u.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrEmpty(req.Search))
        {
            query = query.Where(u =>
                u.Email.Contains(req.Search) ||
                (u.Name != null && u.Name.Contains(req.Search)));
        }

        if (req.IsApproved.HasValue)
        {
            query = query.Where(u => u.IsApproved == req.IsApproved.Value);
        }

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);

        var items = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                Name = u.Name,
                Image = u.Image,
                IsApproved = u.IsApproved,
                IsAdmin = u.IsAdmin,
                CreatedAt = u.CreatedAt,
                ApprovedAt = u.ApprovedAt,
                ApprovedById = u.ApprovedById,
                UploadCount = u.Uploads.Count,
                StorageUsed = u.Settings != null ? u.Settings.StorageUsed : 0
            })
            .ToListAsync(ct);

        var response = new ListUsersResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = req.Page,
            PageSize = req.PageSize,
            TotalPages = totalPages
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
