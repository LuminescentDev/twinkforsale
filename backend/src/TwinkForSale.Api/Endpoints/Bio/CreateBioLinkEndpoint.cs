using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Bio;

public class CreateBioLinkRequest
{
    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? Icon { get; set; }
}

public class CreateBioLinkResponse
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? Icon { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; }
}

public class CreateBioLinkEndpoint : Endpoint<CreateBioLinkRequest>
{
    private readonly AppDbContext _db;
    private const int MaxLinks = 20;

    public CreateBioLinkEndpoint(AppDbContext db)
    {
        _db = db;
    }

    public override void Configure()
    {
        Post("/bio/links");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Bio"));
    }

    public override async Task HandleAsync(CreateBioLinkRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        // Check if user is approved
        var user = await _db.Users.FindAsync([userId], ct);
        if (user == null || !user.IsApproved)
        {
            HttpContext.Response.StatusCode = 403;
            await HttpContext.Response.WriteAsync("Account not approved", ct);
            return;
        }

        // Check link count
        var currentCount = await _db.BioLinks.CountAsync(l => l.UserId == userId, ct);
        if (currentCount >= MaxLinks)
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync($"Maximum bio links limit reached ({MaxLinks})", ct);
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

        // Get next order value
        var maxOrder = await _db.BioLinks
            .Where(l => l.UserId == userId)
            .MaxAsync(l => (int?)l.Order, ct) ?? 0;

        var bioLink = new BioLink
        {
            UserId = userId,
            Title = req.Title,
            Url = req.Url,
            Icon = req.Icon,
            Order = maxOrder + 1,
            IsActive = true
        };

        _db.BioLinks.Add(bioLink);
        await _db.SaveChangesAsync(ct);

        var response = new CreateBioLinkResponse
        {
            Id = bioLink.Id,
            Title = bioLink.Title,
            Url = bioLink.Url,
            Icon = bioLink.Icon,
            Order = bioLink.Order,
            IsActive = bioLink.IsActive
        };

        HttpContext.Response.StatusCode = 201;
        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
