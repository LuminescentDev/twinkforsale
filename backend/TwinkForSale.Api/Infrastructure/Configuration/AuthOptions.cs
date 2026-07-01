namespace TwinkForSale.Api.Infrastructure.Configuration;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string JwtSecret { get; init; } = string.Empty;
}
