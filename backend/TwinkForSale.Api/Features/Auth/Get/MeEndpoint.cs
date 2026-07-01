using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Auth.Get;

public sealed class MeEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<MeResponse>
{
    public override void Configure()
    {
        Get("/api/auth/me");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Summary(summary =>
        {
            summary.Summary = "Returns the authenticated user.";
        });
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var user = await dbContext.Users
            .AsNoTracking()
            .Include(x => x.Settings)
            .FirstOrDefaultAsync(x => x.Id == userId, ct);

        if (user is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(new MeResponse(
            user.Id,
            user.Email,
            user.Name,
            user.Image,
            user.IsApproved,
            user.IsAdmin,
            user.Settings?.BioUsername), ct);
    }
}

public sealed record MeResponse(
    string Id,
    string Email,
    string? Name,
    string? Image,
    bool IsApproved,
    bool IsAdmin,
    string? BioUsername);
