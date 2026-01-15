namespace TwinkForSale.Api.Entities;

public class ApiKey
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Key { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastUsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;
}
