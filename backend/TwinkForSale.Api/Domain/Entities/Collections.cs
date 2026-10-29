namespace TwinkForSale.Api.Domain.Entities;

public sealed class Album
{
    public string Id { get; set; } = EntityIds.NewId();
    public string Code { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public bool ShowOnBio { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<AlbumUpload> Items { get; set; } = [];
}

public sealed class AlbumUpload
{
    public string AlbumId { get; set; } = string.Empty;
    public string UploadId { get; set; } = string.Empty;
    public int Order { get; set; }
    public Album Album { get; set; } = null!;
    public Upload Upload { get; set; } = null!;
}

public sealed class SavedFilter
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Search { get; set; } = string.Empty;
    public string Kind { get; set; } = "all";
    public string? Tag { get; set; }
    public bool FavoritesOnly { get; set; }
    public string Period { get; set; } = "all";
    public string Sort { get; set; } = "date";
    public string Direction { get; set; } = "desc";
}

public sealed class UploadPreset
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? UploadDomainId { get; set; }
    public int? ExpirationDays { get; set; }
    public int? MaxViews { get; set; }
    public string? EmbedTitle { get; set; }
    public string? EmbedDescription { get; set; }
    public string? EmbedColor { get; set; }
    public bool StripMetadata { get; set; }
}

public sealed class FileRequest
{
    public string Id { get; set; } = EntityIds.NewId();
    public string Code { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string AlbumId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public int MaxFiles { get; set; }
    public long MaxFileSize { get; set; }
    public int SubmittedCount { get; set; }
    public bool IsClosed { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class BioDraft
{
    public string UserId { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class BioRevision
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public string Document { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class ShortLinkRevision
{
    public string Id { get; set; } = EntityIds.NewId();
    public string ShortLinkId { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
}
