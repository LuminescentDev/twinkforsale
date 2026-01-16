using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.User;

public record DiscordUserRequest(string UserId);

public record DiscordIdResponse(string? DiscordId);

public class GetDiscordIdEndpoint(AppDbContext db) : Endpoint<DiscordUserRequest, DiscordIdResponse>
{
    public override void Configure()
    {
        Get("/users/{UserId}/discord-id");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(DiscordUserRequest req, CancellationToken ct)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(requesterId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && requesterId != req.UserId)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        var discordAccount = await db.Accounts
            .FirstOrDefaultAsync(a => a.UserId == req.UserId && a.Provider == "discord", ct);

        await SendAsync(new DiscordIdResponse(discordAccount?.ProviderAccountId), cancellation: ct);
    }
}

public class AutoPopulateDiscordIdEndpoint(AppDbContext db) : Endpoint<DiscordUserRequest>
{
    public override void Configure()
    {
        Post("/users/{UserId}/discord-id/auto");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(DiscordUserRequest req, CancellationToken ct)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(requesterId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && requesterId != req.UserId)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        var discordAccount = await db.Accounts
            .FirstOrDefaultAsync(a => a.UserId == req.UserId && a.Provider == "discord", ct);

        if (discordAccount == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var settings = await db.UserSettings.FirstOrDefaultAsync(s => s.UserId == req.UserId, ct);
        if (settings == null)
        {
            settings = new UserSettings { UserId = req.UserId, BioDiscordUserId = discordAccount.ProviderAccountId };
            db.UserSettings.Add(settings);
        }
        else if (string.IsNullOrEmpty(settings.BioDiscordUserId))
        {
            settings.BioDiscordUserId = discordAccount.ProviderAccountId;
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}
