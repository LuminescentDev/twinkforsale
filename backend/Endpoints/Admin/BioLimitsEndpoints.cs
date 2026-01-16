using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Admin;

public class AdminBioLimitsDto
{
    public int? MaxBioLinks { get; set; }
    public int? MaxUsernameLength { get; set; }
    public int? MaxDisplayNameLength { get; set; }
    public int? MaxDescriptionLength { get; set; }
    public int? MaxUrlLength { get; set; }
    public int? MaxLinkTitleLength { get; set; }
    public int? MaxIconLength { get; set; }
}

public class AdminBioLimitsUserDto
{
    public string Id { get; set; } = null!;
    public string? Name { get; set; }
    public string Email { get; set; } = null!;
    public bool IsApproved { get; set; }
    public string? BioUsername { get; set; }
    public int BioLinksCount { get; set; }
    public AdminBioLimitsDto Limits { get; set; } = new();
}

public class AdminBioLimitsResponse
{
    public List<AdminBioLimitsUserDto> Users { get; set; } = [];
}

public class AdminBioLimitsUserRequest
{
    public string UserId { get; set; } = null!;
}

public class UpdateAdminBioLimitsRequest
{
    public string UserId { get; set; } = null!;
    public int? MaxBioLinks { get; set; }
    public int? MaxUsernameLength { get; set; }
    public int? MaxDisplayNameLength { get; set; }
    public int? MaxDescriptionLength { get; set; }
    public int? MaxUrlLength { get; set; }
    public int? MaxLinkTitleLength { get; set; }
    public int? MaxIconLength { get; set; }
}

public class ListAdminBioLimitsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/bio-limits");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var users = await _db.Users
            .Include(u => u.Settings)
            .Include(u => u.BioLinks)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminBioLimitsUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                IsApproved = u.IsApproved,
                BioUsername = u.Settings != null ? u.Settings.BioUsername : null,
                BioLinksCount = u.BioLinks.Count,
                Limits = new AdminBioLimitsDto
                {
                    MaxBioLinks = u.Settings != null ? u.Settings.MaxBioLinks : null,
                    MaxUsernameLength = u.Settings != null ? u.Settings.MaxUsernameLength : null,
                    MaxDisplayNameLength = u.Settings != null ? u.Settings.MaxDisplayNameLength : null,
                    MaxDescriptionLength = u.Settings != null ? u.Settings.MaxDescriptionLength : null,
                    MaxUrlLength = u.Settings != null ? u.Settings.MaxUrlLength : null,
                    MaxLinkTitleLength = u.Settings != null ? u.Settings.MaxLinkTitleLength : null,
                    MaxIconLength = u.Settings != null ? u.Settings.MaxIconLength : null
                }
            })
            .ToListAsync(ct);

        var response = new AdminBioLimitsResponse
        {
            Users = users
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class GetAdminBioLimitsForUserEndpoint(AppDbContext db) : Endpoint<AdminBioLimitsUserRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/bio-limits/{UserId}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(AdminBioLimitsUserRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .Include(u => u.BioLinks)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var response = new AdminBioLimitsUserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            IsApproved = user.IsApproved,
            BioUsername = user.Settings?.BioUsername,
            BioLinksCount = user.BioLinks.Count,
            Limits = new AdminBioLimitsDto
            {
                MaxBioLinks = user.Settings?.MaxBioLinks,
                MaxUsernameLength = user.Settings?.MaxUsernameLength,
                MaxDisplayNameLength = user.Settings?.MaxDisplayNameLength,
                MaxDescriptionLength = user.Settings?.MaxDescriptionLength,
                MaxUrlLength = user.Settings?.MaxUrlLength,
                MaxLinkTitleLength = user.Settings?.MaxLinkTitleLength,
                MaxIconLength = user.Settings?.MaxIconLength
            }
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class UpdateAdminBioLimitsEndpoint(AppDbContext db) : Endpoint<UpdateAdminBioLimitsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Put("/admin/bio-limits/{UserId}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(UpdateAdminBioLimitsRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var user = await _db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == req.UserId, ct);

        if (user == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var settings = user.Settings ?? new UserSettings { UserId = user.Id };

        if (req.MaxBioLinks.HasValue) settings.MaxBioLinks = req.MaxBioLinks.Value;
        if (req.MaxUsernameLength.HasValue) settings.MaxUsernameLength = req.MaxUsernameLength.Value;
        if (req.MaxDisplayNameLength.HasValue) settings.MaxDisplayNameLength = req.MaxDisplayNameLength.Value;
        if (req.MaxDescriptionLength.HasValue) settings.MaxDescriptionLength = req.MaxDescriptionLength.Value;
        if (req.MaxUrlLength.HasValue) settings.MaxUrlLength = req.MaxUrlLength.Value;
        if (req.MaxLinkTitleLength.HasValue) settings.MaxLinkTitleLength = req.MaxLinkTitleLength.Value;
        if (req.MaxIconLength.HasValue) settings.MaxIconLength = req.MaxIconLength.Value;

        settings.UpdatedAt = DateTime.UtcNow;

        if (user.Settings == null)
        {
            _db.UserSettings.Add(settings);
        }

        await _db.SaveChangesAsync(ct);
        HttpContext.Response.StatusCode = 204;
    }
}