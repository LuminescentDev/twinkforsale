namespace TwinkForSale.Api.Domain.Entities;

public sealed class BioLink
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
    public int Clicks { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}
