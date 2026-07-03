using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Admin.Put;

public sealed class UpdateBioLimitsEndpoint(AppDbContext dbContext) : Endpoint<UpdateBioLimitsRequest, UpdateBioLimitsResponse>
{
    public override void Configure()
    {
        Put("/api/admin/bio-limits/{userId}", "/admin/bio-limits/{userId}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(UpdateBioLimitsRequest req, CancellationToken ct)
    {
        var userId = Route<string>("userId");
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var userExists = await dbContext.Users.AnyAsync(x => x.Id == userId, ct);
        if (!userExists)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var settings = await dbContext.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings is null)
        {
            settings = new UserSettings { UserId = userId };
            dbContext.UserSettings.Add(settings);
        }

        var defaults = Features.Admin.Get.BioLimitDefaults.Value;
        settings.MaxBioLinks = ToOverride(req.MaxBioLinks, defaults.MaxBioLinks);
        settings.MaxUsernameLength = ToOverride(req.MaxUsernameLength, defaults.MaxUsernameLength);
        settings.MaxDisplayNameLength = ToOverride(req.MaxDisplayNameLength, defaults.MaxDisplayNameLength);
        settings.MaxDescriptionLength = ToOverride(req.MaxDescriptionLength, defaults.MaxDescriptionLength);
        settings.MaxUrlLength = ToOverride(req.MaxUrlLength, defaults.MaxUrlLength);
        settings.MaxLinkTitleLength = ToOverride(req.MaxLinkTitleLength, defaults.MaxLinkTitleLength);
        settings.MaxIconLength = ToOverride(req.MaxIconLength, defaults.MaxIconLength);
        settings.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateBioLimitsResponse(true), ct);
    }

    private static int? ToOverride(int value, int defaultValue) => value == defaultValue ? null : value;
}

public sealed record UpdateBioLimitsRequest(
    int MaxBioLinks,
    int MaxUsernameLength,
    int MaxDisplayNameLength,
    int MaxDescriptionLength,
    int MaxUrlLength,
    int MaxLinkTitleLength,
    int MaxIconLength);

public sealed record UpdateBioLimitsResponse(bool Success);
