using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Bio;

public class UpdateBioLinkRequest
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? Icon { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateBioLinkEndpoint : Endpoint<UpdateBioLinkRequest>
{
    private readonly AppDbContext _db;

    public UpdateBioLinkEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Put("/bio/links/{Id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(UpdateBioLinkRequest req, CancellationToken ct)
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

        // Validate URL
        if (!Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != "http" && uri.Scheme != "https"))
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Invalid URL", ct);
            return;
        }

        bioLink.Title = req.Title;
        bioLink.Url = req.Url;
        bioLink.Icon = req.Icon;
        bioLink.IsActive = req.IsActive;
        bioLink.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        var response = new BioLinkDto
        {
            Id = bioLink.Id,
            Title = bioLink.Title,
            Url = bioLink.Url,
            Icon = bioLink.Icon,
            Order = bioLink.Order,
            IsActive = bioLink.IsActive
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
