using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.Domains.Get;

public sealed class ListDomainsEndpoint(AppDbContext dbContext) : EndpointWithoutRequest<ListDomainsResponse>
{
    public override void Configure()
    {
        Get("/api/admin/domains", "/domains");
        AuthSchemes(ApiKeyAuthenticationDefaults.Scheme);
        Policies(AuthPolicies.ApprovedUser);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var domains = await dbContext.UploadDomains.AsNoTracking()
            .OrderByDescending(x => x.IsDefault).ThenBy(x => x.Name)
            .Select(x => new DomainDto(
                x.Id,
                x.Domain,
                x.Name,
                x.IsActive,
                x.IsDefault,
                x.SupportsSubdomains,
                x.UserSettings.Count))
            .ToListAsync(ct);
        await SendOkAsync(new ListDomainsResponse(domains), ct);
    }
}

public sealed record ListDomainsResponse(IReadOnlyList<DomainDto> Domains);
public sealed record DomainDto(
    string Id,
    string Domain,
    string Name,
    bool IsActive,
    bool IsDefault,
    bool SupportsSubdomains,
    int UserSettingsCount);
