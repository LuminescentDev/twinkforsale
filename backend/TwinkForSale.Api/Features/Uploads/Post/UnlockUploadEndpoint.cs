using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Post;

public sealed class UnlockUploadEndpoint(AppDbContext db, UploadAccess access) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/f/{shortCode}/unlock");
        AllowAnonymous();
        Options(x => x.RequireRateLimiting("file-password"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        var upload = await db.Uploads.AsNoTracking().FirstOrDefaultAsync(x => x.ShortCode == Route<string>("shortCode", true), ct);
        if (upload is null || !UploadAccess.IsAvailable(upload) || upload.AccessMode != "password")
        { await SendNotFoundAsync(ct); return; }
        if (!HttpContext.Request.HasFormContentType) { await SendAsync(new { error = "Password required." }, 400, ct); return; }
        var password = (await HttpContext.Request.ReadFormAsync(ct))["password"].ToString();
        if (password.Length is < 8 or > 200 || !access.Verify(upload, password))
        { await SendStringAsync("Incorrect password. Go back and try again.", 403, "text/plain", ct); return; }
        access.Grant(upload, HttpContext);
        await SendRedirectAsync($"/f/{upload.ShortCode}");
    }
}
