namespace TwinkForSale.Api.Domain.Entities;

public sealed class DownloadLog
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UploadId { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Referer { get; set; }
    public DateTimeOffset DownloadedAt { get; set; } = DateTimeOffset.UtcNow;

    public Upload? Upload { get; set; }
}
