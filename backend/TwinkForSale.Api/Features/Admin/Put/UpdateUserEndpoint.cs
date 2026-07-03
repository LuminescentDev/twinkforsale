using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Admin.Put;

public sealed class UpdateUserEndpoint(AppDbContext dbContext) : Endpoint<UpdateUserRequest, UpdateUserResponse>
{
    public override void Configure()
    {
        Put("/api/admin/users/{id}", "/admin/users/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(UpdateUserRequest req, CancellationToken ct)
    {
        var id = Route<string>("id");
        var user = await dbContext.Users.Include(x => x.Settings).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (user is null) { await SendNotFoundAsync(ct); return; }

        if (req.IsApproved is not null)
        {
            user.IsApproved = req.IsApproved.Value;
            user.ApprovedAt = req.IsApproved.Value ? DateTimeOffset.UtcNow : null;
            user.ApprovedById = req.IsApproved.Value ? User.GetUserId() : null;
        }
        if (req.IsAdmin is not null) user.IsAdmin = req.IsAdmin.Value;

        if (req.MaxUploads is not null || req.MaxFileSize is not null || req.MaxStorageLimit is not null)
        {
            user.Settings ??= new Domain.Entities.UserSettings { UserId = user.Id };
            if (req.MaxUploads is > 0) user.Settings.MaxUploads = req.MaxUploads.Value;
            if (req.MaxFileSize is > 0) user.Settings.MaxFileSize = req.MaxFileSize.Value;
            user.Settings.MaxStorageLimit = req.MaxStorageLimit;
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateUserResponse(true), ct);
    }
}

public sealed record UpdateUserRequest(bool? IsApproved, bool? IsAdmin, int? MaxUploads, long? MaxFileSize, long? MaxStorageLimit);
public sealed record UpdateUserResponse(bool Success);
