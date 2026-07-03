using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Domains.Delete;

public sealed class DeleteDomainEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<DeleteDomainResponse>
{
    public override void Configure()
    {
        Delete("/api/admin/domains/{id}", "/admin/domains/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<string>("id");
        var domain = await dbContext.UploadDomains.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (domain is null) { await SendNotFoundAsync(ct); return; }
        dbContext.UploadDomains.Remove(domain);
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new DeleteDomainResponse(true), ct);
    }
}

public sealed record DeleteDomainResponse(bool Success);
