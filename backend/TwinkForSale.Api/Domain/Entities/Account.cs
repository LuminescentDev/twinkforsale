namespace TwinkForSale.Api.Domain.Entities;

public sealed class Account
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string ProviderAccountId { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public string? AccessToken { get; set; }
    public int? ExpiresAt { get; set; }
    public string? TokenType { get; set; }
    public string? Scope { get; set; }
    public string? IdToken { get; set; }
    public string? SessionState { get; set; }

    public User? User { get; set; }
}
