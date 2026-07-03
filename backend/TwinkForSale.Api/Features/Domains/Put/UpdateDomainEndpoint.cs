using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Domains.Put;

public sealed class UpdateDomainEndpoint(AppDbContext dbContext) : Endpoint<UpdateDomainRequest, UpdateDomainResponse>
{
    public override void Configure()
    {
        Put("/api/admin/domains/{id}");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(UpdateDomainRequest req, CancellationToken ct)
    {
        var id = Route<string>("id");
        var domain = await dbContext.UploadDomains.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (domain is null) { await SendNotFoundAsync(ct); return; }
        domain.Domain = req.Domain.Trim();
        domain.Name = req.Name.Trim();
        domain.IsActive = req.IsActive;
        domain.IsDefault = req.IsDefault;
        domain.SupportsSubdomains = req.SupportsSubdomains;
        domain.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(ct);
        await SendOkAsync(new UpdateDomainResponse(true), ct);
    }
}

public sealed record UpdateDomainRequest(string Domain, string Name, bool IsActive, bool IsDefault, bool SupportsSubdomains);
public sealed record UpdateDomainResponse(bool Success);
