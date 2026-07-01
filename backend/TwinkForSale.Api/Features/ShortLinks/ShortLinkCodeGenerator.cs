using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Database;

namespace TwinkForSale.Api.Features.ShortLinks;

public sealed class ShortLinkCodeGenerator(AppDbContext dbContext)
{
    private const string Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public async Task<string> GenerateUniqueCodeAsync(CancellationToken cancellationToken)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = GenerateCode(attempt < 5 ? 5 : 8);
            var exists = await dbContext.ShortLinks.AnyAsync(x => x.Code == code, cancellationToken);

            if (!exists)
            {
                return code;
            }
        }

        return EntityIds.NewId()[..12];
    }

    private static string GenerateCode(int length)
    {
        return string.Create(length, Alphabet, static (span, alphabet) =>
        {
            for (var i = 0; i < span.Length; i++)
            {
                span[i] = alphabet[Random.Shared.Next(alphabet.Length)];
            }
        });
    }
}
