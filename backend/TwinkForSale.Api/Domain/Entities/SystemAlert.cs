namespace TwinkForSale.Api.Domain.Entities;

public sealed class SystemAlert
{
    public string Id { get; set; } = EntityIds.NewId();
    public string EventType { get; set; } = string.Empty;
    public double Threshold { get; set; }
    public bool IsActive { get; set; } = true;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CooldownMinutes { get; set; } = 60;
    public bool NotifyAdmins { get; set; } = true;
    public bool NotifyUser { get; set; }
    public DateTimeOffset? LastTriggered { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
