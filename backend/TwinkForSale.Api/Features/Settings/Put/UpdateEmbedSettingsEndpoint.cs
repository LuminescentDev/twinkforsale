using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Settings.Put;

public sealed class UpdateEmbedSettingsEndpoint(AppDbContext dbContext) : Endpoint<UpdateEmbedSettingsRequest, UpdateEmbedSettingsResponse>
{
    public override void Configure()
    {
        Put("/settings/embed");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateEmbedSettingsRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var settings = await dbContext.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings is null)
        {
            settings = new UserSettings { UserId = userId };
            dbContext.UserSettings.Add(settings);
        }

        settings.EmbedTitle = req.EmbedTitle;
        settings.EmbedDescription = req.EmbedDescription;
        settings.EmbedColor = req.EmbedColor;
        settings.EmbedAuthor = req.EmbedAuthor;
        settings.EmbedFooter = req.EmbedFooter;
        settings.ShowFileInfo = req.ShowFileInfo ?? settings.ShowFileInfo;
        settings.ShowUploadDate = req.ShowUploadDate ?? settings.ShowUploadDate;
        settings.ShowUserStats = req.ShowUserStats ?? settings.ShowUserStats;
        settings.CustomDomain = req.CustomDomain;
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateEmbedSettingsResponse(true), ct);
    }
}

public sealed record UpdateEmbedSettingsRequest(
    string? EmbedTitle,
    string? EmbedDescription,
    string? EmbedColor,
    string? EmbedAuthor,
    string? EmbedFooter,
    bool? ShowFileInfo,
    bool? ShowUploadDate,
    bool? ShowUserStats,
    string? CustomDomain);

public sealed record UpdateEmbedSettingsResponse(bool Success);
