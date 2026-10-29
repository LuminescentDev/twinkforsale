using FastEndpoints;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;

namespace TwinkForSale.Api.Features.Bio.Post;

public sealed class CreateBioLinkEndpoint(BioDraftService drafts) : Endpoint<CreateBioLinkRequest, BioLinkMutationResponse>
{
    public override void Configure()
    {
        Post("/bio/links");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CreateBioLinkRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }
        if (!Uri.TryCreate(req.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
        {
            await SendAsync(new BioLinkMutationResponse(false, null, "Invalid URL."), StatusCodes.Status400BadRequest, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 120 || req.Url.Length > 4000)
        { await SendAsync(new BioLinkMutationResponse(false, Error: "Invalid link title or URL."), 400, ct); return; }
        await using var tx = await drafts.LockAsync(userId, ct);
        var document = await drafts.ReadAsync(userId, ct);
        var id = EntityIds.NewId();
        var link = new Get.BioLinkDto(id, req.Title.Trim(), uri.ToString(), req.Icon, req.Order ?? (document.Links.Select(x => x.Order).DefaultIfEmpty(-1).Max() + 1), req.IsActive ?? true, 0);
        var next = document with { Links = document.Links.Append(link).ToArray() };
        var error = await drafts.ValidateAsync(userId, next, ct);
        if (error is not null) { await SendAsync(new BioLinkMutationResponse(false, Error: error), 400, ct); return; }
        await drafts.SaveAsync(userId, next, ct);
        await tx.CommitAsync(ct);
        await SendAsync(new BioLinkMutationResponse(true, id), 201, ct);
    }
}

public sealed record CreateBioLinkRequest(string Title, string Url, string? Icon, int? Order, bool? IsActive);
public sealed record BioLinkMutationResponse(bool Success, string? Id = null, string? Error = null);
