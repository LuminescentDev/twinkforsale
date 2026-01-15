using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class DomainDto
{
    public string Id { get; set; } = null!;
    public string Domain { get; set; } = null!;
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UserCount { get; set; }
}

public class ListDomainsEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;

    public ListDomainsEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Get("/admin/domains");
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

        var domains = await _db.UploadDomains
            .OrderByDescending(d => d.IsDefault)
            .ThenBy(d => d.Domain)
            .Select(d => new DomainDto
            {
                Id = d.Id,
                Domain = d.Domain,
                IsDefault = d.IsDefault,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt,
                UserCount = d.UserSettings.Count
            })
            .ToListAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, domains, (JsonSerializerOptions?)null, ct);
    }
}
