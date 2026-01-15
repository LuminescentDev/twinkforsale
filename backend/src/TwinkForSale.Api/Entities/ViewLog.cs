namespace TwinkForSale.Api.Entities;

public class ViewLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UploadId { get; set; } = null!;
    public Upload Upload { get; set; } = null!;

    // Analytics data
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referrer { get; set; }

    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;
}
