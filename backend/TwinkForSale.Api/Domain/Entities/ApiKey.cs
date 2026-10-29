namespace TwinkForSale.Api.Domain.Entities;

public sealed class ApiKey
{
    public string Id { get; set; } = EntityIds.NewId();
    public string KeyHash { get; set; } = string.Empty;
    public string MaskedKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastUsed { get; set; }
    public bool IsActive { get; set; } = true;

    public User? User { get; set; }
}
