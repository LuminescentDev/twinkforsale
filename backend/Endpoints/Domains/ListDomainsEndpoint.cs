using System.Security.Claims;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;

namespace TwinkForSale.Api.Endpoints.Domains;

public record PublicDomainDto(
    string Id,
    string Domain,
    string Name,
    bool IsDefault,
    bool SupportsSubdomains
);

public class ListDomains(AppDbContext db) : EndpointWithoutRequest<List<PublicDomainDto>>
{
    public override void Configure()
    {
        Get("/domains");
        AuthSchemes("JWT");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var domains = await db.UploadDomains
            .Where(d => d.IsActive)
            .OrderByDescending(d => d.IsDefault)
            .ThenBy(d => d.Domain)
            .Select(d => new PublicDomainDto(
                d.Id,
                d.Domain,
                d.Domain,
                d.IsDefault,
                false
            ))
            .ToListAsync(ct);

        await SendAsync(domains, cancellation: ct);
    }
}
