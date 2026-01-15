namespace TwinkForSale.Api.Entities;

public class BioView
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    // Analytics data
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referer { get; set; }

    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
