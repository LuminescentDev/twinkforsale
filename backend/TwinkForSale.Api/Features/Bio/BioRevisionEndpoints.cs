using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TwinkForSale.Api.Features.Bio.Get;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Bio;

public sealed class BioRevisionEndpoints(AppDbContext db, BioDraftService drafts) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.POST); Routes("/bio/revisions", "/bio/revisions/{id}/restore", "/bio/draft/publish");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId()!;
        if (HttpMethods.IsGet(HttpContext.Request.Method))
        {
            var revisions = await db.BioRevisions.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt)
                .Select(x => new { x.Id, x.CreatedAt }).Take(50).ToListAsync(ct);
            await SendOkAsync(new { revisions, hasDraft = await db.BioDrafts.AnyAsync(x => x.UserId == userId, ct) }, ct); return;
        }
        await using var tx = await drafts.LockAsync(userId, ct);
        var id = Route<string>("id", false);
        if (id is not null)
        {
            var revision = await db.BioRevisions.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
            if (revision is null) { await SendNotFoundAsync(ct); return; }
            await drafts.SaveAsync(userId, JsonSerializer.Deserialize<BioResponse>(revision.Document)!, ct);
        }
        else if (HttpContext.Request.Path == "/bio/draft/publish")
        {
            var document = await drafts.ReadAsync(userId, ct);
            var error = await drafts.ValidateAsync(userId, document, ct);
            if (error is not null) { await SendAsync(new { error }, 400, ct); return; }
            if (!string.IsNullOrEmpty(document.Username) && await db.UserSettings.AnyAsync(x => x.BioUsername == document.Username && x.UserId != userId, ct))
            { await SendAsync(new { error = "Username already taken." }, 409, ct); return; }
            try { await drafts.PublishAsync(userId, document, ct); }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
            { await SendAsync(new { error = "Username already taken." }, 409, ct); return; }
        }
        else { await SendNotFoundAsync(ct); return; }
        await tx.CommitAsync(ct); await SendOkAsync(new { success = true }, ct);
    }
}
