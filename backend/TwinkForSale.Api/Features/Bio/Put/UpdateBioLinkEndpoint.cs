using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio.Put;

public sealed class UpdateBioLinkEndpoint(AppDbContext dbContext) : Endpoint<UpdateBioLinkRequest, UpdateBioLinkResponse>
{
    public override void Configure()
    {
        Put("/bio/links/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateBioLinkRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }

        var link = await dbContext.BioLinks.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (link is null) { await SendNotFoundAsync(ct); return; }
        if (!Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
        {
            await SendAsync(new UpdateBioLinkResponse(false, "Invalid URL."), StatusCodes.Status400BadRequest, ct);
            return;
        }

        link.Title = req.Title.Trim();
        link.Url = uri.ToString();
        link.Icon = req.Icon;
        link.Order = req.Order;
        link.IsActive = req.IsActive;
        link.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateBioLinkResponse(true), ct);
    }
}

public sealed record UpdateBioLinkRequest(string Title, string Url, string? Icon, int Order, bool IsActive);
public sealed record UpdateBioLinkResponse(bool Success, string? Error = null);
