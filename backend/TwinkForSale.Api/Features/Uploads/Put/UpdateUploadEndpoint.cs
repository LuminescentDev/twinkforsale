using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Put;

public sealed class UpdateUploadEndpoint(AppDbContext db, UploadAccess access) : Endpoint<UpdateUploadRequest>
{
    public override void Configure()
    {
        Put("/uploads/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(UpdateUploadRequest req, CancellationToken ct)
    {
        if (req.DisplayName is { Length: > 255 } || req.Tags is null || req.Tags.Length > 20 ||
            req.Tags.Any(x => string.IsNullOrWhiteSpace(x) || x.Length > 40) ||
            req.AccessMode is not ("public" or "members" or "password") ||
            req.Password is { Length: > 200 } || req.MaxViews <= 0)
        { await SendAsync(new { error = "Invalid name, tags, access setting, or view limit." }, 400, ct); return; }
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var userId = User.GetUserId();
        await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        var upload = await db.Uploads.FirstOrDefaultAsync(x => x.Id == Route<string>("id", true) && x.UserId == userId && x.DeletedAt == null, ct);
        if (upload is null) { await SendNotFoundAsync(ct); return; }
        if (req.AccessMode == "password" && ((upload.PasswordHash is null && string.IsNullOrEmpty(req.Password)) ||
            (!string.IsNullOrEmpty(req.Password) && req.Password.Length < 8)))
        { await SendAsync(new { error = "Use a password of at least 8 characters." }, 400, ct); return; }
        upload.DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? null : req.DisplayName.Trim();
        upload.Tags = req.Tags.Select(x => x.Trim().ToLowerInvariant()).Distinct().ToArray();
        upload.IsFavorite = req.IsFavorite;
        upload.IsRevoked = req.IsRevoked;
        upload.ExpiresAt = req.ExpiresAt?.ToUniversalTime();
        upload.MaxViews = req.MaxViews;
        upload.AccessMode = req.AccessMode;
        if (req.AccessMode != "password") upload.PasswordHash = null;
        else if (!string.IsNullOrEmpty(req.Password)) upload.PasswordHash = access.Hash(upload, req.Password);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        await SendOkAsync(new { success = true }, ct);
    }
}

public sealed record UpdateUploadRequest(string? DisplayName, string[] Tags, bool IsFavorite, bool IsRevoked,
    DateTimeOffset? ExpiresAt, int? MaxViews, string AccessMode = "public", string? Password = null);
