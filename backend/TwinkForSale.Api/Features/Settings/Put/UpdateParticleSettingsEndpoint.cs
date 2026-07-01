using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Settings.Put;

public sealed class UpdateParticleSettingsEndpoint(AppDbContext dbContext) : Endpoint<UpdateParticleSettingsRequest, UpdateSettingsResponse>
{
    public override void Configure()
    {
        Put("/api/settings/particles");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateParticleSettingsRequest req, CancellationToken ct)
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

        settings.GlobalParticleConfig = req.GlobalParticleConfig;
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(new UpdateSettingsResponse(true), ct);
    }
}

public sealed record UpdateParticleSettingsRequest(string? GlobalParticleConfig);
