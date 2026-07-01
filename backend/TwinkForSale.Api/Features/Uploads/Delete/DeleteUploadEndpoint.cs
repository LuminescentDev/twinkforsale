using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;

namespace TwinkForSale.Api.Features.Uploads.Delete;

public sealed class DeleteUploadEndpoint(AppDbContext dbContext, IFileStorage fileStorage) : EndpointWithoutRequest<DeleteUploadResponse>
{
    public override void Configure()
    {
        Delete("/api/uploads/{id}", "/api/dashboard/uploads/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.GetUserId();
        var uploadId = Route<string>("id");
        if (string.IsNullOrWhiteSpace(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var upload = await dbContext.Uploads.FirstOrDefaultAsync(x => x.Id == uploadId && x.UserId == userId, ct);
        if (upload is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await fileStorage.DeleteAsync(upload.Filename, ct);

        var settings = await dbContext.UserSettings.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (settings is not null)
        {
            settings.StorageUsed = Math.Max(0, settings.StorageUsed - upload.Size);
        }

        dbContext.Uploads.Remove(upload);
        await dbContext.SaveChangesAsync(ct);

        await SendOkAsync(new DeleteUploadResponse(true), ct);
    }
}

public sealed record DeleteUploadResponse(bool Success);
