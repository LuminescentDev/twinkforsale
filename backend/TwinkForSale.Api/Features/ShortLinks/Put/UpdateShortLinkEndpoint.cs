using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks.Put;

public sealed class UpdateShortLinkEndpoint(AppDbContext db) : Endpoint<UpdateShortLinkRequest>
{
    public override void Configure()
    {
        Put("/short-links/{id}"); AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(UpdateShortLinkRequest req, CancellationToken ct)
    {
        if (req.Url?.Length > 4000 || !Uri.TryCreate(req.Url?.Trim(), UriKind.Absolute, out var target) || target.Scheme is not ("http" or "https"))
        { await SendAsync(new { error = "Enter a valid HTTP or HTTPS destination." }, 400, ct); return; }
        var userId = User.GetUserId();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        var link = await db.ShortLinks.FirstOrDefaultAsync(x => x.Id == Route<string>("id", true) && x.UserId == userId, ct);
        if (link is null) { await SendNotFoundAsync(ct); return; }
        if (link.Url != target.ToString())
        {
            db.ShortLinkRevisions.Add(new ShortLinkRevision { ShortLinkId = link.Id, Url = link.Url });
            link.Url = target.ToString();
        }
        link.IsPaused = req.IsPaused;
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        await SendOkAsync(new { success = true }, ct);
    }
}
public sealed record UpdateShortLinkRequest(string Url, bool IsPaused);

public sealed class ShortLinkHistoryEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/short-links/{id}/history"); AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id", true);
        if (!await db.ShortLinks.AnyAsync(x => x.Id == id && x.UserId == User.GetUserId(), ct)) { await SendNotFoundAsync(ct); return; }
        var history = await db.ShortLinkRevisions.AsNoTracking().Where(x => x.ShortLinkId == id).OrderByDescending(x => x.ChangedAt)
            .Select(x => new { x.Id, x.Url, x.ChangedAt }).Take(100).ToListAsync(ct);
        await SendOkAsync(new { history }, ct);
    }
}
