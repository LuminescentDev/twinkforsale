namespace TwinkForSale.Api.Entities;

public class UserSettings
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = null!;
    public User User { get; set; } = null!;

    // Upload settings
    public int MaxUploads { get; set; } = 100;
    public long MaxFileSize { get; set; } = 10485760; // 10MB
    public long? MaxStorageLimit { get; set; }
    public long StorageUsed { get; set; }

    // URL shortener limits
    public int MaxShortLinks { get; set; } = 500;

    // Discord embed settings
    public string? EmbedTitle { get; set; } = "File Upload";
    public string? EmbedDescription { get; set; } = "Uploaded via twink.forsale";
    public string? EmbedColor { get; set; } = "#8B5CF6";
    public string? EmbedAuthor { get; set; }
    public string? EmbedFooter { get; set; } = "twink.forsale";
    public bool ShowFileInfo { get; set; } = true;
    public bool ShowUploadDate { get; set; } = true;
    public bool ShowUserStats { get; set; }
    public string? CustomDomain { get; set; }

    // Upload domain selection
    public string? UploadDomainId { get; set; }
    public UploadDomain? UploadDomain { get; set; }
    public string? CustomSubdomain { get; set; }

    // URL/Shortcode preferences
    public bool UseCustomWords { get; set; }
    public string? CustomWords { get; set; }

    // Global expiration and view limit settings
    public int? DefaultExpirationDays { get; set; }
    public int? DefaultMaxViews { get; set; }

    // Global particle configuration
    public string? GlobalParticleConfig { get; set; }

    // Bio service fields
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
    public DateTime? BioLastViewed { get; set; }

    // Bio background effects
    public string? BioGradientConfig { get; set; }
    public string? BioParticleConfig { get; set; }

    // Discord integration via Lanyard API
    public string? BioDiscordUserId { get; set; }
    public bool BioShowDiscord { get; set; }
    public string? BioDiscordConfig { get; set; }

    // Bio service limits
    public int? MaxBioLinks { get; set; } = 10;
    public int? MaxUsernameLength { get; set; } = 20;
    public int? MaxDisplayNameLength { get; set; } = 20;
    public int? MaxDescriptionLength { get; set; } = 1000;
    public int? MaxUrlLength { get; set; } = 200;
    public int? MaxLinkTitleLength { get; set; } = 50;
    public int? MaxIconLength { get; set; } = 20;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
