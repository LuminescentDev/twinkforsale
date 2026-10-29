using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Features.Bio.Get;
using TwinkForSale.Api.Features.Bio.Put;
using TwinkForSale.Api.Features.Admin.Get;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Security;

namespace TwinkForSale.Api.Features.Bio;

public sealed class BioDraftService(AppDbContext db)
{
    public async Task<IDbContextTransaction> LockAsync(string userId, CancellationToken ct)
    {
        var tx = await db.Database.BeginTransactionAsync(ct);
        try { await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct); return tx; }
        catch { await tx.DisposeAsync(); throw; }
    }

    public async Task<BioResponse> PublishedAsync(string userId, CancellationToken ct)
    {
        var settings = await db.UserSettings.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, ct);
        var links = await db.BioLinks.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.Order)
            .Select(x => new BioLinkDto(x.Id, x.Title, x.Url, x.Icon, x.Order, x.IsActive, x.Clicks)).ToListAsync(ct);
        return BioResponse.From(settings, links);
    }

    public async Task<BioResponse> ReadAsync(string userId, CancellationToken ct)
    {
        var draft = await db.BioDrafts.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, ct);
        return draft is null ? await PublishedAsync(userId, ct) : JsonSerializer.Deserialize<BioResponse>(draft.Document)!;
    }

    public async Task SaveAsync(string userId, BioResponse document, CancellationToken ct)
    {
        var draft = await db.BioDrafts.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (draft is null) { draft = new BioDraft { UserId = userId }; db.BioDrafts.Add(draft); }
        draft.Document = JsonSerializer.Serialize(document); draft.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public static BioResponse Update(BioResponse document, UpdateBioRequest req) => document with
    {
        Username = req.Username?.Trim(), DisplayName = req.DisplayName, Description = req.Description,
        ProfileImage = req.ProfileImage, BackgroundImage = req.BackgroundImage, BackgroundColor = req.BackgroundColor,
        TextColor = req.TextColor, AccentColor = req.AccentColor, CustomCss = CssSanitizer.Sanitize(req.CustomCss),
        SpotifyTrack = req.SpotifyTrack, IsPublic = req.IsPublic, GradientConfig = req.GradientConfig,
        ParticleConfig = req.ParticleConfig, DiscordUserId = req.DiscordUserId, ShowDiscord = req.ShowDiscord, DiscordConfig = req.DiscordConfig
    };

    public async Task<string?> ValidateAsync(string userId, BioResponse document, CancellationToken ct)
    {
        var settings = await db.UserSettings.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, ct);
        var limits = BioLimitsDto.FromSettings(settings, BioLimitDefaults.Value);
        if (document.Username?.Length > limits.MaxUsernameLength || (!string.IsNullOrEmpty(document.Username) &&
            (!System.Text.RegularExpressions.Regex.IsMatch(document.Username, "^[A-Za-z0-9_-]+$") ||
            new[] { "dashboard", "upload", "setup", "auth", "a", "r", "f", "l", "delete", "privacy", "terms", "dmca", "acceptable-use" }.Contains(document.Username.ToLowerInvariant()))))
            return $"Choose a username of up to {limits.MaxUsernameLength} letters, digits, hyphens, or underscores.";
        if (document.IsPublic && string.IsNullOrWhiteSpace(document.Username)) return "Set a username before publishing.";
        if (document.DisplayName?.Length > limits.MaxDisplayNameLength || document.Description?.Length > limits.MaxDescriptionLength || document.CustomCss?.Length > 20000 || document.Links.Count > limits.MaxBioLinks)
            return "The bio exceeds its text or link limit.";
        foreach (var url in new[] { document.ProfileImage, document.BackgroundImage }.Where(x => !string.IsNullOrEmpty(x)))
            if (url!.Length > limits.MaxUrlLength || !Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")) return "Images must use HTTP or HTTPS URLs within your URL length limit.";
        foreach (var link in document.Links)
            if (string.IsNullOrWhiteSpace(link.Title) || link.Title.Length > limits.MaxLinkTitleLength || link.Url.Length > limits.MaxUrlLength ||
                link.Icon?.Length > limits.MaxIconLength || link.Order < 0 || !Uri.TryCreate(link.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
                return "A link exceeds your limits or has an invalid HTTP/HTTPS URL.";
        return null;
    }

    public async Task PublishAsync(string userId, BioResponse document, CancellationToken ct)
    {
        db.BioRevisions.Add(new BioRevision { UserId = userId, Document = JsonSerializer.Serialize(await PublishedAsync(userId, ct)) });
        var settings = await db.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings is null) { settings = new UserSettings { UserId = userId }; db.UserSettings.Add(settings); }
        settings.BioUsername = document.Username; settings.BioDisplayName = document.DisplayName;
        settings.BioDescription = document.Description; settings.BioProfileImage = document.ProfileImage;
        settings.BioBackgroundImage = document.BackgroundImage; settings.BioBackgroundColor = document.BackgroundColor;
        settings.BioTextColor = document.TextColor; settings.BioAccentColor = document.AccentColor;
        settings.BioCustomCss = CssSanitizer.Sanitize(document.CustomCss); settings.BioSpotifyTrack = document.SpotifyTrack;
        settings.BioIsPublic = document.IsPublic; settings.BioGradientConfig = document.GradientConfig;
        settings.BioParticleConfig = document.ParticleConfig; settings.BioDiscordUserId = document.DiscordUserId;
        settings.BioShowDiscord = document.ShowDiscord; settings.BioDiscordConfig = document.DiscordConfig;
        settings.UpdatedAt = DateTimeOffset.UtcNow;
        var existing = await db.BioLinks.Where(x => x.UserId == userId).ToListAsync(ct);
        foreach (var link in existing.Where(x => document.Links.All(d => d.Id != x.Id))) db.BioLinks.Remove(link);
        foreach (var value in document.Links)
        {
            var link = existing.FirstOrDefault(x => x.Id == value.Id);
            if (link is null) { link = new BioLink { Id = value.Id, UserId = userId }; db.BioLinks.Add(link); }
            link.Title = value.Title; link.Url = value.Url; link.Icon = value.Icon; link.Order = value.Order;
            link.IsActive = value.IsActive; link.UpdatedAt = DateTimeOffset.UtcNow;
        }
        await db.BioDrafts.Where(x => x.UserId == userId).ExecuteDeleteAsync(ct);
        await db.SaveChangesAsync(ct);
        var old = await db.BioRevisions.Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).Skip(50).Select(x => x.Id).ToListAsync(ct);
        await db.BioRevisions.Where(x => old.Contains(x.Id)).ExecuteDeleteAsync(ct);
    }
}
