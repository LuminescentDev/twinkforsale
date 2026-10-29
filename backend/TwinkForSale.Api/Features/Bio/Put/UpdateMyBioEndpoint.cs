using FastEndpoints;
using TwinkForSale.Api.Infrastructure.Auth;

namespace TwinkForSale.Api.Features.Bio.Put;

public sealed class UpdateMyBioEndpoint(BioDraftService drafts) : Endpoint<UpdateBioRequest, UpdateBioResponse>
{
    public override void Configure()
    {
        Put("/bio/me");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateBioRequest req, CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (string.IsNullOrWhiteSpace(userId)) { await SendUnauthorizedAsync(ct); return; }

        await using var tx = await drafts.LockAsync(userId, ct);
        var document = BioDraftService.Update(await drafts.ReadAsync(userId, ct), req);
        var error = await drafts.ValidateAsync(userId, document, ct);
        if (error is not null) { await SendAsync(new UpdateBioResponse(false, error), 400, ct); return; }
        await drafts.SaveAsync(userId, document, ct);
        await tx.CommitAsync(ct);
        await SendOkAsync(new UpdateBioResponse(true), ct);
    }
}

public sealed record UpdateBioRequest(
    string? Username,
    string? DisplayName,
    string? Description,
    string? ProfileImage,
    string? BackgroundImage,
    string? BackgroundColor,
    string? TextColor,
    string? AccentColor,
    string? CustomCss,
    string? SpotifyTrack,
    bool IsPublic,
    string? GradientConfig,
    string? ParticleConfig,
    string? DiscordUserId,
    bool ShowDiscord,
    string? DiscordConfig);

public sealed record UpdateBioResponse(bool Success, string? Error = null);
