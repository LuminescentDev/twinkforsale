using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks.Delete;

public sealed class DeleteShortLinkEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<DeleteShortLinkResponse>
{
    public override void Configure()
    {
        Delete("/api/short-links/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var id = Route<string>("id");
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var link = await dbContext.ShortLinks.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (link is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        dbContext.ShortLinks.Remove(link);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(new DeleteShortLinkResponse(true), ct);
    }
}

public sealed record DeleteShortLinkResponse(bool Success);
