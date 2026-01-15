namespace TwinkForSale.Api.Entities;

public class Upload
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string FileName { get; set; } = null!;
    public string OriginalName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long Size { get; set; }
    public string Url { get; set; } = null!;
    public string ShortCode { get; set; } = null!;
    public string DeletionKey { get; set; } = Guid.NewGuid().ToString("N");

    // Storage paths
    public string StoragePath { get; set; } = null!;
    public string? ThumbnailPath { get; set; }

    // Image dimensions
    public int? Width { get; set; }
    public int? Height { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    // Per-file limits
    public int? MaxViews { get; set; }
    public bool IsPublic { get; set; } = true;

    // User association
    public string? UserId { get; set; }
    public User? User { get; set; }

    // Analytics
    public int ViewCount { get; set; }
    public int DownloadCount { get; set; }
    public DateTime? LastViewedAt { get; set; }
    public DateTime? LastDownloadedAt { get; set; }

    public ICollection<ViewLog> ViewLogs { get; set; } = [];
    public ICollection<DownloadLog> DownloadLogs { get; set; } = [];
}
