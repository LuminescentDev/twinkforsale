using FastEndpoints;
using TwinkForSale.Api.Infrastructure.Auth;

namespace TwinkForSale.Api.Features.Bio.Put;

public sealed class UpdateBioLinkEndpoint(BioDraftService drafts) : Endpoint<UpdateBioLinkRequest, UpdateBioLinkResponse>
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

        if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 120 || req.Url?.Length > 4000 ||
            !Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
        { await SendAsync(new UpdateBioLinkResponse(false, "Invalid link title or URL."), 400, ct); return; }
        await using var tx = await drafts.LockAsync(userId, ct);
        var document = await drafts.ReadAsync(userId, ct);
        var link = document.Links.FirstOrDefault(x => x.Id == id);
        if (link is null) { await SendNotFoundAsync(ct); return; }
        var updated = link with { Title = req.Title.Trim(), Url = uri.ToString(), Icon = req.Icon, Order = req.Order, IsActive = req.IsActive };
        var next = document with { Links = document.Links.Select(x => x.Id == id ? updated : x).ToArray() };
        var error = await drafts.ValidateAsync(userId, next, ct);
        if (error is not null) { await SendAsync(new UpdateBioLinkResponse(false, error), 400, ct); return; }
        await drafts.SaveAsync(userId, next, ct);
        await tx.CommitAsync(ct);
        await SendOkAsync(new UpdateBioLinkResponse(true), ct);
    }
}

public sealed record UpdateBioLinkRequest(string Title, string Url, string? Icon, int Order, bool IsActive);
public sealed record UpdateBioLinkResponse(bool Success, string? Error = null);
