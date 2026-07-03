using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Admin.Get;

public sealed class ListUsersEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ListUsersResponse>
{
    public override void Configure()
    {
        Get("/api/admin/users");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var users = await dbContext.Users.AsNoTracking()
            .Include(x => x.Settings)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AdminUserDto(
                x.Id, x.Email, x.Name, x.Image, x.CreatedAt, x.IsApproved, x.IsAdmin,
                x.Settings != null ? x.Settings.StorageUsed : 0,
                x.Uploads.Count,
                x.ApiKeys.Count(k => k.IsActive)))
            .ToListAsync(ct);
        await SendOkAsync(new ListUsersResponse(users), ct);
    }
}

public sealed record ListUsersResponse(IReadOnlyList<AdminUserDto> Users);
public sealed record AdminUserDto(string Id, string Email, string? Name, string? Image, DateTimeOffset CreatedAt, bool IsApproved, bool IsAdmin, long StorageUsed, int Uploads, int ApiKeys);
