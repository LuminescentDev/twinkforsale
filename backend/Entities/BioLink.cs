namespace TwinkForSale.Api.Entities;

public class BioLink
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    public string Title { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string? Icon { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;

    // Analytics
    public int Clicks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
