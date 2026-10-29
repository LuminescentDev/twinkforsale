using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Features.Uploads;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.FileRequests;

public sealed record FileRequestInput(string AlbumId, string Title, string? Description, DateTimeOffset ExpiresAt, int MaxFiles, long MaxFileSize);

public sealed class FileRequestEndpoints(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.POST, Http.DELETE); Routes("/file-requests", "/file-requests/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        if (HttpMethods.IsGet(HttpContext.Request.Method))
        {
            var requests = await db.FileRequests.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
            await SendOkAsync(new { requests }, ct); return;
        }
        if (HttpMethods.IsDelete(HttpContext.Request.Method))
        {
            await using var closing = await db.Database.BeginTransactionAsync(ct);
            await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
            if (await db.FileRequests.Where(x => x.Id == Route<string>("id", false) && x.UserId == userId)
                .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsClosed, true), ct) == 0)
            { await SendNotFoundAsync(ct); return; }
            await closing.CommitAsync(ct);
            await SendOkAsync(new { success = true }, ct); return;
        }
        var req = await Infrastructure.RequestJson.ReadAsync<FileRequestInput>(HttpContext.Request, ct);
        var now = DateTimeOffset.UtcNow;
        if (req is null || string.IsNullOrWhiteSpace(req.Title) || req.Title.Length > 120 || req.Description?.Length > 2000 ||
            req.MaxFiles is < 1 or > 500 || req.MaxFileSize <= 0 || req.ExpiresAt <= now || req.ExpiresAt > now.AddYears(1))
        { await SendAsync(new { error = "Set a title, expiration within one year, and positive file limits (up to 500 files)." }, 400, ct); return; }
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        var settings = await db.UserSettings.FirstAsync(x => x.UserId == userId, ct);
        if (req.MaxFileSize > settings.MaxFileSize || !await db.Albums.AnyAsync(x => x.Id == req.AlbumId && x.UserId == userId, ct))
        { await SendAsync(new { error = "Choose your own album and a file size within your upload limit." }, 400, ct); return; }
        if (await db.FileRequests.CountAsync(x => x.UserId == userId && !x.IsClosed && x.ExpiresAt > now, ct) >= 50)
        { await SendAsync(new { error = "Active request limit reached (50)." }, 409, ct); return; }
        var request = new FileRequest { UserId = userId!, AlbumId = req.AlbumId, Title = req.Title.Trim(), Description = req.Description?.Trim(),
            ExpiresAt = req.ExpiresAt.ToUniversalTime(), MaxFiles = req.MaxFiles, MaxFileSize = req.MaxFileSize };
        db.FileRequests.Add(request); await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        await SendOkAsync(new { request.Id, request.Code }, ct);
    }
}

public sealed class PublicFileRequestEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure() { Get("/public/file-requests/{code}"); AllowAnonymous(); }
    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        var now = DateTimeOffset.UtcNow;
        var request = await db.FileRequests.AsNoTracking().FirstOrDefaultAsync(x => x.Code == Route<string>("code", true) && !x.IsClosed && x.ExpiresAt > now && x.SubmittedCount < x.MaxFiles, ct);
        if (request is null) { await SendNotFoundAsync(ct); return; }
        await SendOkAsync(new { request.Title, request.Description, request.ExpiresAt, request.MaxFileSize, remainingFiles = request.MaxFiles - request.SubmittedCount }, ct);
    }
}

public sealed class SubmitFileRequestEndpoint(AppDbContext db, IFileStorage storage, UploadCodeGenerator codes,
    IOptions<AppOptions> options, ILogger<SubmitFileRequestEndpoint> logger) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/public/file-requests/{code}"); AllowAnonymous(); AllowFileUploads();
        Options(x => x.RequireRateLimiting("file-request"));
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        string? stored = null;
        var committed = false;
        try
        {
            var requestCode = Route<string>("code", true);
            var ownerId = await db.FileRequests.Where(x => x.Code == requestCode).Select(x => x.UserId).FirstOrDefaultAsync(ct);
            if (ownerId is null) { await SendNotFoundAsync(ct); return; }
            if (!HttpContext.Request.HasFormContentType) { await SendAsync(new { error = "Choose a file." }, 400, ct); return; }
            var form = await HttpContext.Request.ReadFormAsync(ct);
            var file = form.Files.GetFile("file");
            if (file is null || file.Length == 0 || form.Files.Count != 1) { await SendAsync(new { error = "Submit one non-empty file at a time." }, 400, ct); return; }
            await using var tx = await db.Database.BeginTransactionAsync(ct);
            await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {ownerId} FOR UPDATE").ToListAsync(ct);
            var request = await db.FileRequests.FirstOrDefaultAsync(x => x.Code == requestCode, ct);
            if (request is null || request.IsClosed || request.ExpiresAt <= DateTimeOffset.UtcNow || request.SubmittedCount >= request.MaxFiles ||
                !await db.Users.AnyAsync(x => x.Id == ownerId && x.IsApproved, ct))
            { await SendNotFoundAsync(ct); return; }
            var settings = await db.UserSettings.FirstAsync(x => x.UserId == ownerId, ct);
            if (file.Length > request.MaxFileSize || file.Length > settings.MaxFileSize ||
                file.Length > (settings.MaxStorageLimit ?? options.Value.BaseStorageLimit) - settings.StorageUsed ||
                await db.Uploads.CountAsync(x => x.UserId == ownerId, ct) >= settings.MaxUploads)
            { await SendAsync(new { error = "This request cannot accept the file within its limits." }, 413, ct); return; }
            var code = await codes.GenerateUniqueShortCodeAsync(ct);
            var result = await storage.UploadAsync(file, $"{code}_submission", ownerId, ct);
            if (!result.Success || string.IsNullOrWhiteSpace(result.Key)) throw new IOException("Storage rejected request submission.");
            stored = result.Key;
            var mime = Microsoft.Net.Http.Headers.MediaTypeHeaderValue.TryParse(file.ContentType, out var parsed) ? parsed.MediaType.Value! : "application/octet-stream";
            var upload = new Upload { Filename = stored, OriginalName = Path.GetFileName(file.FileName), MimeType = mime.ToLowerInvariant(), Size = file.Length,
                ShortCode = code, DeletionKey = EntityIds.NewId(), Url = $"{options.Value.BaseUrl.TrimEnd('/')}/f/{code}",
                UserId = ownerId, FileRequestId = request.Id, IsPending = true };
            db.Uploads.Add(upload); settings.StorageUsed += file.Length; request.SubmittedCount++;
            await db.SaveChangesAsync(ct); await tx.CommitAsync(ct); committed = true;
            await SendAsync(new { success = true, message = "Submitted for owner approval." }, 201, ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (InvalidDataException) { await SendAsync(new { error = "Invalid file data." }, 400, ct); }
        catch (Exception ex) { logger.LogError(ex, "File request submission failed."); await SendAsync(new { error = "Submission failed. Please try again." }, 500, ct); }
        finally
        {
            if (stored is not null && !committed)
            {
                try { await storage.DeleteAsync(stored, CancellationToken.None); }
                catch (Exception ex) { logger.LogError(ex, "Failed to remove an uncommitted request submission."); }
            }
        }
    }
}

public sealed class ApproveSubmissionEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/uploads/{id}/approve"); AuthSchemes(ApiKeyAuthenticationDefaults.Scheme); Policies(AuthPolicies.ApprovedUser);
    }
    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        await using var tx = await db.Database.BeginTransactionAsync(ct);
        await db.Users.FromSqlInterpolated($"SELECT * FROM users WHERE \"Id\" = {userId} FOR UPDATE").ToListAsync(ct);
        var upload = await db.Uploads.FirstOrDefaultAsync(x => x.Id == Route<string>("id", true) && x.UserId == userId && x.IsPending && x.DeletedAt == null, ct);
        if (upload is null) { await SendNotFoundAsync(ct); return; }
        var request = await db.FileRequests.FirstOrDefaultAsync(x => x.Id == upload.FileRequestId && x.UserId == userId, ct);
        if (request is not null)
        {
            var order = await db.AlbumUploads.Where(x => x.AlbumId == request.AlbumId).MaxAsync(x => (int?)x.Order, ct) ?? -1;
            if (await db.AlbumUploads.CountAsync(x => x.AlbumId == request.AlbumId, ct) >= 500)
            { await SendAsync(new { error = "The album is full. Remove a file before approving." }, 409, ct); return; }
            db.AlbumUploads.Add(new AlbumUpload { AlbumId = request.AlbumId, UploadId = upload.Id, Order = order + 1 });
        }
        upload.IsPending = false;
        await db.SaveChangesAsync(ct); await tx.CommitAsync(ct);
        await SendOkAsync(new { success = true }, ct);
    }
}
