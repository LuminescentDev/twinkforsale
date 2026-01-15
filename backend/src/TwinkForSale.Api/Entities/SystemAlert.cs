namespace TwinkForSale.Api.Entities;

public class SystemAlert
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string EventType { get; set; } = null!;
    public double Threshold { get; set; }
    public bool IsActive { get; set; } = true;

    // Alert configuration
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public int CooldownMinutes { get; set; } = 60;

    // Notification settings
    public bool NotifyAdmins { get; set; } = true;
    public bool NotifyUser { get; set; }

    public DateTime? LastTriggered { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
