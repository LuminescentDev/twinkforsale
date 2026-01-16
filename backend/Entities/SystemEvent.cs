namespace TwinkForSale.Api.Entities;

public class SystemEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Type { get; set; } = null!;
    public string Severity { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? Metadata { get; set; } // JSON

    // User association (nullable for system-wide events)
    public string? UserId { get; set; }
    public User? User { get; set; }

    // System metrics at time of event
    public double? CpuUsage { get; set; }
    public double? MemoryUsage { get; set; }
    public double? DiskUsage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
