using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Admin.Get;

public sealed class BioLimitsEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<BioLimitsResponse>
{
    public override void Configure()
    {
        Get("/admin/bio-limits");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var defaults = BioLimitDefaults.Value;
        var users = await dbContext.Users.AsNoTracking()
            .Include(x => x.Settings)
            .Include(x => x.BioLinks)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);

        var responseUsers = users
            .Select(x => new BioLimitsUserDto(
                x.Id,
                x.Name,
                x.Email,
                x.IsApproved,
                x.Settings?.BioUsername,
                x.BioLinks.Count,
                BioLimitsDto.FromSettings(x.Settings, defaults)))
            .ToList();

        await SendOkAsync(new BioLimitsResponse(responseUsers, defaults), ct);
    }
}

public static class BioLimitDefaults
{
    public static BioLimitsDto Value { get; } = new(10, 20, 20, 1000, 200, 50, 20);
}

public sealed record BioLimitsResponse(IReadOnlyList<BioLimitsUserDto> Users, BioLimitsDto DefaultLimits);
public sealed record BioLimitsUserDto(string Id, string? Name, string Email, bool IsApproved, string? BioUsername, int BioLinksCount, BioLimitsDto EffectiveLimits);
public sealed record BioLimitsDto(int MaxBioLinks, int MaxUsernameLength, int MaxDisplayNameLength, int MaxDescriptionLength, int MaxUrlLength, int MaxLinkTitleLength, int MaxIconLength)
{
    public static BioLimitsDto FromSettings(Domain.Entities.UserSettings? settings, BioLimitsDto defaults) => new(
        settings?.MaxBioLinks ?? defaults.MaxBioLinks,
        settings?.MaxUsernameLength ?? defaults.MaxUsernameLength,
        settings?.MaxDisplayNameLength ?? defaults.MaxDisplayNameLength,
        settings?.MaxDescriptionLength ?? defaults.MaxDescriptionLength,
        settings?.MaxUrlLength ?? defaults.MaxUrlLength,
        settings?.MaxLinkTitleLength ?? defaults.MaxLinkTitleLength,
        settings?.MaxIconLength ?? defaults.MaxIconLength);
}
