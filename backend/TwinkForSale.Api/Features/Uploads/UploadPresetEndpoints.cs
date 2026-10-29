using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads;

public sealed class UploadPresetEndpoints(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.POST, Http.DELETE); Routes("/upload-presets", "/upload-presets/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (HttpMethods.IsGet(HttpContext.Request.Method))
        {
            await SendOkAsync(new {
                presets = await db.UploadPresets.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.Name).ToListAsync(ct),
                domains = await db.UploadDomains.AsNoTracking().Where(x => x.IsActive).Select(x => new { x.Id, x.Domain, x.Name }).ToListAsync(ct)
            }, ct); return;
        }
        if (HttpMethods.IsDelete(HttpContext.Request.Method))
        {
            if (await db.UploadPresets.Where(x => x.Id == Route<string>("id", false) && x.UserId == userId).ExecuteDeleteAsync(ct) == 0)
            { await SendNotFoundAsync(ct); return; }
        }
        else
        {
            var req = await Infrastructure.RequestJson.ReadAsync<UploadPreset>(HttpContext.Request, ct);
            if (req is null || string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 80 || req.ExpirationDays is <= 0 or > 36500 || req.MaxViews <= 0 ||
                req.EmbedTitle?.Length > 200 || req.EmbedDescription?.Length > 2000 ||
                (req.EmbedColor is not null && (req.EmbedColor.Length != 7 || req.EmbedColor[0] != '#' || !req.EmbedColor.Skip(1).All(Uri.IsHexDigit))))
            { await SendAsync(new { error = "Invalid preset settings." }, 400, ct); return; }
            if (req.UploadDomainId is not null && !await db.UploadDomains.AnyAsync(x => x.Id == req.UploadDomainId && x.IsActive, ct))
            { await SendAsync(new { error = "Choose an active domain." }, 400, ct); return; }
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
            if (await db.UploadPresets.CountAsync(x => x.UserId == userId, ct) >= 50)
            { await SendAsync(new { error = "Preset limit reached (50)." }, 409, ct); return; }
            req.Id = EntityIds.NewId(); req.UserId = userId!; req.Name = req.Name.Trim();
            db.UploadPresets.Add(req); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        }
        await SendOkAsync(new { success = true }, ct);
    }
}
