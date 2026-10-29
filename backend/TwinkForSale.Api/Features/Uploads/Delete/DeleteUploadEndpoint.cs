using FastEndpoints;
using TwinkForSale.Api.Infrastructure.Auth;

namespace TwinkForSale.Api.Features.Uploads.Delete;

public sealed class DeleteUploadEndpoint(UploadDeletion deletion) : EndpointWithoutRequest<DeleteUploadResponse>
{
    public override void Configure()
    {
        Delete("/uploads/{id}", "/dashboard/uploads/{id}");
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

        if (!await deletion.DeleteAsync(uploadId!, userId, ct, permanent: HttpContext.Request.Query["permanent"] == "true"))
        {
            await SendNotFoundAsync(ct);
            return;
        }

        await SendOkAsync(new DeleteUploadResponse(true), ct);
    }
}

public sealed record DeleteUploadResponse(bool Success);
