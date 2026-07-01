namespace TwinkForSale.Api.Domain.Entities;

public sealed class BioView
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referer { get; set; }
    public DateTimeOffset ViewedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
}
