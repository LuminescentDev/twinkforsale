using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class UpdateDomainRequest
{
    public string Id { get; set; } = null!;
    public string Domain { get; set; } = null!;
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateDomainEndpoint(AppDbContext db, ILogger<UpdateDomainEndpoint> logger) : Endpoint<UpdateDomainRequest>
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<UpdateDomainEndpoint> _logger = logger;

  public override void Configure()
    {
        Put("/admin/domains/{Id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(UpdateDomainRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var uploadDomain = await _db.UploadDomains.FindAsync([req.Id], ct);
        if (uploadDomain == null)
        {
            HttpContext.Response.StatusCode = 404;
            await HttpContext.Response.WriteAsync("Domain not found", ct);
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

        // Check uniqueness (excluding current domain)
        var exists = await _db.UploadDomains.AnyAsync(
            d => d.Domain == domain && d.Id != req.Id, ct);
        if (exists)
        {
            HttpContext.Response.StatusCode = 409;
            await HttpContext.Response.WriteAsync("Domain already exists", ct);
            return;
        }

        // If setting as default, unset other defaults
        if (req.IsDefault && !uploadDomain.IsDefault)
        {
            await _db.UploadDomains
                .Where(d => d.IsDefault && d.Id != req.Id)
                .ExecuteUpdateAsync(d => d.SetProperty(x => x.IsDefault, false), ct);
        }

        uploadDomain.Domain = domain;
        uploadDomain.IsDefault = req.IsDefault;
        uploadDomain.IsActive = req.IsActive;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Domain updated: {Domain}", domain);

        // Get user count
        var userCount = await _db.UserSettings.CountAsync(
            s => s.UploadDomainId == uploadDomain.Id, ct);

        var response = new DomainDto
        {
            Id = uploadDomain.Id,
            Domain = uploadDomain.Domain,
            IsDefault = uploadDomain.IsDefault,
            IsActive = uploadDomain.IsActive,
            CreatedAt = uploadDomain.CreatedAt,
            UserCount = userCount
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
