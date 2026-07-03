namespace TwinkForSale.Api.Domain.Entities;

public sealed class VerificationToken
{
    public string Identifier { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset Expires { get; set; }
}
