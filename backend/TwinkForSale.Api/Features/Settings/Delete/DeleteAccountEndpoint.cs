using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Settings.Delete;

public sealed class DeleteAccountEndpoint(AppDbContext dbContext, IFileStorage fileStorage) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/api/settings/account");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
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
            .Include(x => x.Uploads)
            .FirstOrDefaultAsync(x => x.Id == userId, ct);

        if (user is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        foreach (var upload in user.Uploads)
        {
            try
            {
                await fileStorage.DeleteAsync(upload.Filename, ct);
            }
            catch
            {
                // Storage cleanup is best-effort; database deletion remains authoritative.
            }
        }

        await dbContext.Users
            .Where(x => x.ApprovedById == userId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.ApprovedById, (string?)null), ct);

        await dbContext.ShortLinks
            .Where(x => x.UserId == userId)
            .ExecuteDeleteAsync(ct);

        dbContext.Uploads.RemoveRange(user.Uploads);
        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync(ct);

        HttpContext.Response.Cookies.Delete(BrowserSessionDefaults.SessionCookieName, new CookieOptions { Path = "/" });
        await SendNoContentAsync(ct);
    }
}
