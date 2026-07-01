namespace TwinkForSale.Api.Domain.Entities;

public sealed class Upload
{
    public string Id { get; set; } = EntityIds.NewId();
    public string Filename { get; set; } = string.Empty;
    public string OriginalName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Url { get; set; } = string.Empty;
    public string ShortCode { get; set; } = string.Empty;
    public string DeletionKey { get; set; } = string.Empty;
    public int? Width { get; set; }
    public int? Height { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ExpiresAt { get; set; }
    public int? MaxViews { get; set; }
    public string? UserId { get; set; }
    public int Views { get; set; }
    public int Downloads { get; set; }
    public DateTimeOffset? LastViewed { get; set; }
    public DateTimeOffset? LastDownloaded { get; set; }

    public User? User { get; set; }
    public ICollection<ViewLog> ViewLogs { get; set; } = [];
    public ICollection<DownloadLog> DownloadLogs { get; set; } = [];
}
