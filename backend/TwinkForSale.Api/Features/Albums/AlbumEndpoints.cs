using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Albums;

public sealed record AlbumRequest(string Title, string? Description, DateTimeOffset? ExpiresAt, bool ShowOnBio, string[] UploadIds);

public sealed class AlbumEndpoints(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.POST, Http.PUT, Http.DELETE);
        Routes("/albums", "/albums/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var id = Route<string>("id", false);
        var method = HttpContext.Request.Method;
        if (HttpMethods.IsGet(method))
        {
            var albums = await db.Albums.AsNoTracking().Where(x => x.UserId == userId && (id == null || x.Id == id))
                .OrderByDescending(x => x.CreatedAt).Select(x => new
                {
                    x.Id, x.Code, x.Title, x.Description, x.ExpiresAt, x.ShowOnBio,
                    uploadIds = x.Items.OrderBy(i => i.Order).Select(i => i.UploadId).ToArray(),
                    files = x.Items.OrderBy(i => i.Order).Select(i => new { id = i.UploadId, name = i.Upload.DisplayName ?? i.Upload.OriginalName }).ToArray()
                }).ToListAsync(ct);
            await SendOkAsync(new { albums }, ct); return;
        }
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        var album = id is null ? null : await db.Albums.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (HttpMethods.IsDelete(method))
        {
            if (album is null) { await SendNotFoundAsync(ct); return; }
            db.Albums.Remove(album);
        }
        else
        {
            if (!HttpMethods.IsPost(method) && album is null) { await SendNotFoundAsync(ct); return; }
            var req = await Infrastructure.RequestJson.ReadAsync<AlbumRequest>(HttpContext.Request, ct);
            if (req is null || string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 120 || req.Description?.Length > 2000 || req.UploadIds is null || req.UploadIds.Length > 500)
            { await SendAsync(new { error = "Provide a title, description up to 2,000 characters, and at most 500 files." }, 400, ct); return; }
            var ids = req.UploadIds.Distinct().ToArray();
            if (await db.Uploads.CountAsync(x => ids.Contains(x.Id) && x.UserId == userId && x.DeletedAt == null && !x.IsPending, ct) != ids.Length)
            { await SendAsync(new { error = "Select only your available files." }, 400, ct); return; }
            if (album is null)
            {
                if (await db.Albums.CountAsync(x => x.UserId == userId, ct) >= 100)
                { await SendAsync(new { error = "Album limit reached (100)." }, 409, ct); return; }
                album = new Album { UserId = userId! };
                db.Albums.Add(album);
            }
            album.Title = req.Title.Trim(); album.Description = req.Description?.Trim();
            album.ExpiresAt = req.ExpiresAt?.ToUniversalTime(); album.ShowOnBio = req.ShowOnBio;
            foreach (var item in album.Items.Where(x => !ids.Contains(x.UploadId)).ToArray()) db.AlbumUploads.Remove(item);
            for (var i = 0; i < ids.Length; i++)
            {
                var item = album.Items.FirstOrDefault(x => x.UploadId == ids[i]);
                if (item is null) album.Items.Add(new AlbumUpload { AlbumId = album.Id, UploadId = ids[i], Order = i });
                else item.Order = i;
            }
        }
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        await SendOkAsync(new { success = true, id = album!.Id, code = album.Code }, ct);
    }
}

public sealed class PublicAlbumEndpoint(AppDbContext db, IOptions<AppOptions> options) : EndpointWithoutRequest
{
    public override void Configure() { Get("/public/albums/{code}"); AllowAnonymous(); }
    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        var now = DateTimeOffset.UtcNow;
        var album = await db.Albums.AsNoTracking().FirstOrDefaultAsync(x => x.Code == Route<string>("code", true) && (x.ExpiresAt == null || x.ExpiresAt > now), ct);
        if (album is null) { await SendNotFoundAsync(ct); return; }
        var member = User.HasClaim(AppClaimTypes.IsApproved, "true");
        var frontend = options.Value.FrontendUrl.TrimEnd('/');
        var items = await db.AlbumUploads.AsNoTracking().Where(x => x.AlbumId == album.Id && x.Upload.DeletedAt == null &&
            !x.Upload.IsPending && !x.Upload.IsRevoked && (x.Upload.ExpiresAt == null || x.Upload.ExpiresAt > now) &&
            (x.Upload.MaxViews == null || x.Upload.Views < x.Upload.MaxViews) &&
            (x.Upload.AccessMode == "public" || (member && x.Upload.AccessMode == "members")))
            .OrderBy(x => x.Order).Select(x => new { x.Upload.Id, name = x.Upload.DisplayName ?? x.Upload.OriginalName,
                x.Upload.MimeType, x.Upload.Size, Url = x.Upload.AccessMode == "members" ? frontend + "/f/" + x.Upload.ShortCode : x.Upload.Url,
                x.Upload.Width, x.Upload.Height }).ToListAsync(ct);
        await SendOkAsync(new { album.Title, album.Description, album.ExpiresAt, items }, ct);
    }
}

public sealed class BioAlbumsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure() { Get("/public/bio/{username}/albums"); AllowAnonymous(); }
    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        var userId = await db.UserSettings.Where(x => x.BioUsername == Route<string>("username", true) && x.BioIsPublic).Select(x => x.UserId).FirstOrDefaultAsync(ct);
        if (userId is null) { await SendNotFoundAsync(ct); return; }
        var now = DateTimeOffset.UtcNow;
        var albums = await db.Albums.AsNoTracking().Where(x => x.UserId == userId && x.ShowOnBio && (x.ExpiresAt == null || x.ExpiresAt > now))
            .OrderByDescending(x => x.CreatedAt).Select(x => new { x.Code, x.Title, x.Description }).ToListAsync(ct);
        await SendOkAsync(new { albums }, ct);
    }
}
