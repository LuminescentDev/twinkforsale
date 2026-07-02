using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio.Delete;

public sealed class DeleteBioLinkEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<DeleteBioLinkResponse>
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

        var link = await dbContext.BioLinks.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (link is null) { await SendNotFoundAsync(ct); return; }

        dbContext.BioLinks.Remove(link);
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new DeleteBioLinkResponse(true), ct);
    }
}

public sealed record DeleteBioLinkResponse(bool Success);
