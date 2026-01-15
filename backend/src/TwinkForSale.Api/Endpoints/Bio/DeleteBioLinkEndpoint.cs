using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Bio;

public class DeleteBioLinkRequest
{
    public string Id { get; set; } = null!;
}

public class DeleteBioLinkEndpoint : Endpoint<DeleteBioLinkRequest>
{
    private readonly AppDbContext _db;

    public DeleteBioLinkEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Delete("/bio/links/{Id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(DeleteBioLinkRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var bioLink = await _db.BioLinks.FirstOrDefaultAsync(
            l => l.Id == req.Id && l.UserId == userId, ct);

        if (bioLink == null)
        {
            HttpContext.Response.StatusCode = 404;
            await HttpContext.Response.WriteAsync("Link not found", ct);
            return;
        }

        _db.BioLinks.Remove(bioLink);
        await _db.SaveChangesAsync(ct);

        HttpContext.Response.StatusCode = 204;
    }
}
