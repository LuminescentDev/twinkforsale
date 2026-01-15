using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.User;

public class DiscordUserRequest
{
    public string UserId { get; set; } = null!;
}

public class DiscordIdResponse
{
    public string? DiscordId { get; set; }
}

public class GetDiscordIdEndpoint(AppDbContext db) : Endpoint<DiscordUserRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/users/{UserId}/discord-id");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Users"));
    }

    public override async Task HandleAsync(DiscordUserRequest req, CancellationToken ct)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(requesterId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && requesterId != req.UserId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var discordAccount = await _db.Accounts
            .FirstOrDefaultAsync(a => a.UserId == req.UserId && a.Provider == "discord", ct);

        var response = new DiscordIdResponse
        {
            DiscordId = discordAccount?.ProviderAccountId
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class AutoPopulateDiscordIdEndpoint(AppDbContext db) : Endpoint<DiscordUserRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Post("/users/{UserId}/discord-id/auto");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Users"));
    }

    public override async Task HandleAsync(DiscordUserRequest req, CancellationToken ct)
    {
        var requesterId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(requesterId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && requesterId != req.UserId)
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var discordAccount = await _db.Accounts
            .FirstOrDefaultAsync(a => a.UserId == req.UserId && a.Provider == "discord", ct);

        if (discordAccount == null)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        var settings = await _db.UserSettings.FirstOrDefaultAsync(s => s.UserId == req.UserId, ct);
        if (settings == null)
        {
            settings = new UserSettings { UserId = req.UserId, BioDiscordUserId = discordAccount.ProviderAccountId };
            _db.UserSettings.Add(settings);
        }
        else if (string.IsNullOrEmpty(settings.BioDiscordUserId))
        {
            settings.BioDiscordUserId = discordAccount.ProviderAccountId;
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
        HttpContext.Response.StatusCode = 204;
    }
}