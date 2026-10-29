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
    public string? DisplayName { get; set; }
    public bool IsFavorite { get; set; }
    public string[] Tags { get; set; } = [];
    public string AccessMode { get; set; } = "public";
    public string? PasswordHash { get; set; }
    public bool IsRevoked { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public bool IsPending { get; set; }
    public string? FileRequestId { get; set; }
    public string? EmbedTitle { get; set; }
    public string? EmbedDescription { get; set; }
    public string? EmbedColor { get; set; }

    public User? User { get; set; }
    public ICollection<ViewLog> ViewLogs { get; set; } = [];
    public ICollection<DownloadLog> DownloadLogs { get; set; } = [];
}
