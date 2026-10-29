using FastEndpoints;
using TwinkForSale.Api.Infrastructure.Auth;

namespace TwinkForSale.Api.Features.Bio.Delete;

public sealed class DeleteBioLinkEndpoint(BioDraftService drafts) : EndpointWithoutRequest<DeleteBioLinkResponse>
{
    public override void Configure()
    {
        Delete("/bio/links/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }

        await using var tx = await drafts.LockAsync(userId, ct);
        var document = await drafts.ReadAsync(userId, ct);
        if (!document.Links.Any(x => x.Id == id)) { await SendNotFoundAsync(ct); return; }
        await drafts.SaveAsync(userId, document with { Links = document.Links.Where(x => x.Id != id).ToArray() }, ct);
        await tx.CommitAsync(ct);
        await SendOkAsync(new DeleteBioLinkResponse(true), ct);
    }
}

public sealed record DeleteBioLinkResponse(bool Success);
