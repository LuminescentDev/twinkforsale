using System.Net;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Uploads.Delete;

public sealed class DeleteUploadByKeyEndpoint(AppDbContext dbContext, UploadDeletion deletion) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Verbs(Http.GET, Http.POST);
        Routes("/delete/{key}");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        HttpContext.Response.Headers.CacheControl = "no-store";
        HttpContext.Response.Headers["Referrer-Policy"] = "no-referrer";
        HttpContext.Response.Headers.ContentSecurityPolicy = "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
        var key = Route<string>("key");
        var upload = await dbContext.Uploads.AsNoTracking().FirstOrDefaultAsync(x => x.DeletionKey == key, ct);
        if (upload is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        if (HttpMethods.IsPost(HttpContext.Request.Method))
        {
            if (!await deletion.DeleteAsync(upload.Id, upload.UserId, ct))
            {
                await SendNotFoundAsync(ct);
                return;
            }
            await HttpContext.Response.SendStringAsync("File deleted.", cancellation: ct);
            return;
        }

        var name = WebUtility.HtmlEncode(upload.OriginalName);
        await HttpContext.Response.SendStringAsync($"""
            <!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Delete file</title></head>
            <body><main><h1>Delete file?</h1><p>Delete {name} permanently? This cannot be undone.</p><form method="post"><button type="submit">Delete file</button></form></main></body></html>
            """, contentType: "text/html; charset=utf-8", cancellation: ct);
    }
}
