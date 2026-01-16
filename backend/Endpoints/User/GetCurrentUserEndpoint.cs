using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.User;

public record UserSettingsResponse(
    int MaxUploads,
    long MaxFileSize,
    long? MaxStorageLimit,
    long StorageUsed,
    int MaxShortLinks,
    string? EmbedTitle,
    string? EmbedColor,
    bool UseCustomWords
);

public record CurrentUserResponse(
    string Id,
    string Email,
    string? Name,
    string? Image,
    bool IsApproved,
    bool IsAdmin,
    DateTime CreatedAt,
    UserSettingsResponse? Settings
);

public class GetCurrentUser(AppDbContext db) : EndpointWithoutRequest<CurrentUserResponse>
{
    public override void Configure()
    {
        Get("/users/me");
        AuthSchemes("JWT", "ApiKey");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var user = await db.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var response = new CurrentUserResponse(
            user.Id,
            user.Email,
            user.Name,
            user.Image,
            user.IsApproved,
            user.IsAdmin,
            user.CreatedAt,
            user.Settings != null ? new UserSettingsResponse(
                user.Settings.MaxUploads,
                user.Settings.MaxFileSize,
                user.Settings.MaxStorageLimit,
                user.Settings.StorageUsed,
                user.Settings.MaxShortLinks,
                user.Settings.EmbedTitle,
                user.Settings.EmbedColor,
                user.Settings.UseCustomWords
            ) : null
        );

        await SendAsync(response, cancellation: ct);
    }
}
