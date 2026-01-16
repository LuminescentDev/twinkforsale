using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Admin;

public class CreateDomainRequest
{
    public string Domain { get; set; } = null!;
    public bool IsDefault { get; set; }
}

public class CreateDomainEndpoint(AppDbContext db, ILogger<CreateDomainEndpoint> logger) : Endpoint<CreateDomainRequest>
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<CreateDomainEndpoint> _logger = logger;

  public override void Configure()
    {
        Post("/admin/domains");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CreateDomainRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        // Validate domain format
        var domain = req.Domain.ToLowerInvariant().Trim();
        if (!Uri.CheckHostName(domain).HasFlag(UriHostNameType.Dns))
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Invalid domain format", ct);
            return;
        }

        // Check uniqueness
        var exists = await _db.UploadDomains.AnyAsync(d => d.Domain == domain, ct);
        if (exists)
        {
            HttpContext.Response.StatusCode = 409;
            await HttpContext.Response.WriteAsync("Domain already exists", ct);
            return;
        }

        // If setting as default, unset other defaults
        if (req.IsDefault)
        {
            await _db.UploadDomains
                .Where(d => d.IsDefault)
                .ExecuteUpdateAsync(d => d.SetProperty(x => x.IsDefault, false), ct);
        }

        var uploadDomain = new UploadDomain
        {
            Domain = domain,
            IsDefault = req.IsDefault,
            IsActive = true
        };

        _db.UploadDomains.Add(uploadDomain);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Domain created: {Domain}", domain);

        var response = new DomainDto
        {
            Id = uploadDomain.Id,
            Domain = uploadDomain.Domain,
            IsDefault = uploadDomain.IsDefault,
            IsActive = uploadDomain.IsActive,
            CreatedAt = uploadDomain.CreatedAt,
            UserCount = 0
        };

        HttpContext.Response.StatusCode = 201;
        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
