using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Settings.Delete;

public sealed class DeleteAccountEndpoint(AppDbContext dbContext, IFileStorage fileStorage, IOptions<AppOptions> appOptions, ILogger<DeleteAccountEndpoint> logger) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/settings/account");
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

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
        await dbContext.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
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
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Account deletion could not remove a stored file.");
                await SendAsync(new { error = "Some files could not be removed. Please retry account deletion." }, StatusCodes.Status503ServiceUnavailable, ct);
                return;
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
        await transaction.CommitAsync(ct);

        HttpContext.Response.Cookies.Delete(BrowserSessionDefaults.SessionCookieName, new CookieOptions
        {
            Path = "/",
            Domain = string.IsNullOrWhiteSpace(appOptions.Value.CookieDomain) ? null : appOptions.Value.CookieDomain
        });
        await SendNoContentAsync(ct);
    }
}
