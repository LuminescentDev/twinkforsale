using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Admin;

public class DeleteDomainRequest
{
    public string Id { get; set; } = null!;
}

public class DeleteDomainEndpoint(AppDbContext db, ILogger<DeleteDomainEndpoint> logger) : Endpoint<DeleteDomainRequest>
{
    private readonly AppDbContext _db = db;
    private readonly ILogger<DeleteDomainEndpoint> _logger = logger;

  public override void Configure()
    {
        Delete("/admin/domains/{Id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(DeleteDomainRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var domain = await _db.UploadDomains
            .Include(d => d.UserSettings)
            .FirstOrDefaultAsync(d => d.Id == req.Id, ct);

        if (domain == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        if (domain.UserSettings.Count > 0)
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Cannot delete domain with active users", ct);
            return;
        }

        _db.UploadDomains.Remove(domain);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Domain deleted: {Domain}", domain.Domain);

        HttpContext.Response.StatusCode = 204;
    }
}
