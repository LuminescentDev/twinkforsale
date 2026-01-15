using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Domains;

public class PublicDomainDto
{
    public string Id { get; set; } = null!;
    public string Domain { get; set; } = null!;
    public string Name { get; set; } = null!;
    public bool IsDefault { get; set; }
    public bool SupportsSubdomains { get; set; }
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
        Get("/domains");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Domains"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var domains = await _db.UploadDomains
            .Where(d => d.IsActive)
            .OrderByDescending(d => d.IsDefault)
            .ThenBy(d => d.Domain)
            .Select(d => new PublicDomainDto
            {
                Id = d.Id,
                Domain = d.Domain,
                Name = d.Domain, // Use domain as name for now
                IsDefault = d.IsDefault,
                SupportsSubdomains = false // TODO: Add this field to entity if needed
            })
            .ToListAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, domains, (JsonSerializerOptions?)null, ct);
    }
}
