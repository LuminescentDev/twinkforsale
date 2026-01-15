namespace TwinkForSale.Api.Entities;

public class ShortLink
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Code { get; set; } = null!;
    public string TargetUrl { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    // Optional click limits
    public int? MaxClicks { get; set; }
    public int ClickCount { get; set; }
    public DateTime? LastClickedAt { get; set; }

    // User association
    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    // Click logs navigation
    public ICollection<ClickLog> ClickLogs { get; set; } = [];
}
