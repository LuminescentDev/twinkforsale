using FastEndpoints;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Domains.Post;

public sealed class CreateDomainEndpoint(AppDbContext dbContext) : Endpoint<CreateDomainRequest, DomainMutationResponse>
{
    public override void Configure()
    {
        Post("/admin/domains");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.Admin);
    }

    public override async Task HandleAsync(CreateDomainRequest req, CancellationToken ct)
    {
        var domain = new UploadDomain
        {
            Domain = req.Domain.Trim(),
            Name = req.Name.Trim(),
            IsActive = req.IsActive,
            IsDefault = req.IsDefault,
            SupportsSubdomains = req.SupportsSubdomains
        };
        dbContext.UploadDomains.Add(domain);
        await dbContext.SaveChangesAsync(ct);
        await SendAsync(new DomainMutationResponse(true, domain.Id), StatusCodes.Status201Created, ct);
    }
}

public sealed record CreateDomainRequest(string Domain, string Name, bool IsActive, bool IsDefault, bool SupportsSubdomains);
public sealed record DomainMutationResponse(bool Success, string? Id = null, string? Error = null);
