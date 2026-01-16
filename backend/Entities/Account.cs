namespace TwinkForSale.Api.Entities;

public class Account
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Provider { get; set; } = null!;
    public string ProviderAccountId { get; set; } = null!;
    public string? RefreshToken { get; set; }
    public string? AccessToken { get; set; }
    public int? ExpiresAt { get; set; }
    public string? TokenType { get; set; }
    public string? Scope { get; set; }
    public string? IdToken { get; set; }
    public string? SessionState { get; set; }

    public User User { get; set; } = null!;
}
