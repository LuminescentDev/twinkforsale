namespace TwinkForSale.Api.Entities;

public class ClickLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ShortLinkId { get; set; } = null!;
    public ShortLink ShortLink { get; set; } = null!;

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }
    public string? Country { get; set; }
    public DateTime ClickedAt { get; set; } = DateTime.UtcNow;
}
