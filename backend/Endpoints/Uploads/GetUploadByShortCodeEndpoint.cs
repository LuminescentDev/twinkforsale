using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Uploads;

public record UploadByShortCodeRequest(string ShortCode);

public record UploadByShortCodeResponse(
    string Id,
    string ShortCode,
    string OriginalName,
    string ContentType,
    long Size,
    int ViewCount,
    int DownloadCount,
    DateTime CreatedAt,
    string UserId,
    string? UserEmail);

public class GetUploadByShortCodeEndpoint(AppDbContext db) : Endpoint<UploadByShortCodeRequest, UploadByShortCodeResponse>
{
    public override void Configure()
    {
        Get("/uploads/short/{ShortCode}");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(UploadByShortCodeRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var upload = await db.Uploads
            .Include(u => u.User)
            .FirstOrDefaultAsync(u => u.ShortCode == req.ShortCode, ct);

        if (upload == null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        var isAdmin = User.FindFirstValue("isAdmin") == "True";
        if (!isAdmin && upload.UserId != userId)
        {
            await SendForbiddenAsync(ct);
            return;
        }

        var response = new UploadByShortCodeResponse(
            upload.Id,
            upload.ShortCode,
            upload.OriginalName,
            upload.ContentType,
            upload.Size,
            upload.ViewCount,
            upload.DownloadCount,
            upload.CreatedAt,
            upload.UserId ?? string.Empty,
            upload.User?.Email);

        await SendAsync(response, cancellation: ct);
    }
}
