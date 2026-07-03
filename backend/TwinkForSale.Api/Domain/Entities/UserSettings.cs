namespace TwinkForSale.Api.Domain.Entities;

public sealed class UserSettings
{
    public string Id { get; set; } = EntityIds.NewId();
    public string UserId { get; set; } = string.Empty;
    public int MaxUploads { get; set; } = 100;
    public long MaxFileSize { get; set; } = 10_485_760;
    public long? MaxStorageLimit { get; set; }
    public long StorageUsed { get; set; }
    public int MaxShortLinks { get; set; } = 500;
    public string? EmbedTitle { get; set; } = "File Upload";
    public string? EmbedDescription { get; set; } = "Uploaded via twink.forsale";
    public string? EmbedColor { get; set; } = "#8B5CF6";
    public string? EmbedAuthor { get; set; }
    public string? EmbedFooter { get; set; } = "twink.forsale";
    public bool ShowFileInfo { get; set; } = true;
    public bool ShowUploadDate { get; set; } = true;
    public bool ShowUserStats { get; set; }
    public string? CustomDomain { get; set; }
    public string? UploadDomainId { get; set; }
    public string? CustomSubdomain { get; set; }
    public bool UseCustomWords { get; set; }
    public int? DefaultExpirationDays { get; set; }
    public int? DefaultMaxViews { get; set; }
    public string? GlobalParticleConfig { get; set; }
    public string? BioUsername { get; set; }
    public string? BioDisplayName { get; set; }
    public string? BioDescription { get; set; }
    public string? BioProfileImage { get; set; }
    public string? BioBackgroundImage { get; set; }
    public string? BioBackgroundColor { get; set; } = "#8B5CF6";
    public string? BioTextColor { get; set; } = "#FFFFFF";
    public string? BioAccentColor { get; set; } = "#F59E0B";
    public string? BioCustomCss { get; set; }
    public string? BioSpotifyTrack { get; set; }
    public bool BioIsPublic { get; set; }
    public int BioViews { get; set; }
    public DateTimeOffset? BioLastViewed { get; set; }
    public string? BioGradientConfig { get; set; }
    public string? BioParticleConfig { get; set; }
    public string? BioDiscordUserId { get; set; }
    public bool BioShowDiscord { get; set; }
    public string? BioDiscordConfig { get; set; }
    public int? MaxBioLinks { get; set; } = 10;
    public int? MaxUsernameLength { get; set; } = 20;
    public int? MaxDisplayNameLength { get; set; } = 20;
    public int? MaxDescriptionLength { get; set; } = 1000;
    public int? MaxUrlLength { get; set; } = 200;
    public int? MaxLinkTitleLength { get; set; } = 50;
    public int? MaxIconLength { get; set; } = 20;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User? User { get; set; }
    public UploadDomain? UploadDomain { get; set; }
}
