using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads;

public sealed class SavedFilterEndpoints(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.POST, Http.DELETE); Routes("/saved-filters", "/saved-filters/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (HttpMethods.IsGet(HttpContext.Request.Method))
        { await SendOkAsync(new { filters = await db.SavedFilters.AsNoTracking().Where(x => x.UserId == userId).OrderBy(x => x.Name).ToListAsync(ct) }, ct); return; }
        if (HttpMethods.IsDelete(HttpContext.Request.Method))
        {
            var count = await db.SavedFilters.Where(x => x.Id == Route<string>("id", false) && x.UserId == userId).ExecuteDeleteAsync(ct);
            if (count == 0) { await SendNotFoundAsync(ct); return; }
        }
        else
        {
            var req = await Infrastructure.RequestJson.ReadAsync<SavedFilter>(HttpContext.Request, ct);
            if (req is null || string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 80 || req.Search is null || req.Search.Length > 200 || req.Tag?.Length > 40 ||
                req.Kind is not ("all" or "image" or "video" or "audio" or "document" or "archive" or "other") ||
                req.Period is not ("all" or "week" or "month") || req.Sort is not ("date" or "name" or "size" or "views" or "downloads") || req.Direction is not ("asc" or "desc"))
            { await SendAsync(new { error = "Invalid saved filter." }, 400, ct); return; }
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
            if (await db.SavedFilters.CountAsync(x => x.UserId == userId, ct) >= 50)
            { await SendAsync(new { error = "Saved filter limit reached (50)." }, 409, ct); return; }
            req.Id = EntityIds.NewId(); req.UserId = userId!; req.Name = req.Name.Trim();
            db.SavedFilters.Add(req); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        }
        await SendOkAsync(new { success = true }, ct);
    }
}
