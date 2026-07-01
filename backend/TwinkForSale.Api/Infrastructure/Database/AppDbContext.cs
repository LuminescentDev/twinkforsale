using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;

namespace TwinkForSale.Api.Infrastructure.Database;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<BioLink> BioLinks => Set<BioLink>();
    public DbSet<BioView> BioViews => Set<BioView>();
    public DbSet<DailyAnalytics> DailyAnalytics => Set<DailyAnalytics>();
    public DbSet<DownloadLog> DownloadLogs => Set<DownloadLog>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<ShortLink> ShortLinks => Set<ShortLink>();
    public DbSet<SystemAlert> SystemAlerts => Set<SystemAlert>();
    public DbSet<SystemEvent> SystemEvents => Set<SystemEvent>();
    public DbSet<Upload> Uploads => Set<Upload>();
    public DbSet<UploadDomain> UploadDomains => Set<UploadDomain>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<VerificationToken> VerificationTokens => Set<VerificationToken>();
    public DbSet<ViewLog> ViewLogs => Set<ViewLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureUsers(modelBuilder);
        ConfigureAuth(modelBuilder);
        ConfigureSettings(modelBuilder);
        ConfigureUploads(modelBuilder);
        ConfigureAnalytics(modelBuilder);
        ConfigureDomains(modelBuilder);
        ConfigureSystem(modelBuilder);
        ConfigureBio(modelBuilder);
        ConfigureShortLinks(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Email).IsUnique();

            entity.Property(x => x.Email).HasColumnName("email").IsRequired();
            entity.Property(x => x.Name).HasColumnName("name");
            entity.Property(x => x.EmailVerified).HasColumnName("emailVerified");
            entity.Property(x => x.Image).HasColumnName("image");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.UpdatedAt).HasColumnName("updatedAt");
            entity.Property(x => x.IsApproved).HasColumnName("isApproved");
            entity.Property(x => x.IsAdmin).HasColumnName("isAdmin");
            entity.Property(x => x.ApprovedAt).HasColumnName("approvedAt");
            entity.Property(x => x.ApprovedById).HasColumnName("approvedById");

            entity.HasOne(x => x.ApprovedBy)
                .WithMany(x => x.ApprovedUsers)
                .HasForeignKey(x => x.ApprovedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureAuth(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.Provider, x.ProviderAccountId }).IsUnique();

            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.ProviderAccountId).HasColumnName("providerAccountId");
            entity.Property(x => x.RefreshToken).HasColumnName("refresh_token");
            entity.Property(x => x.AccessToken).HasColumnName("access_token");
            entity.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            entity.Property(x => x.TokenType).HasColumnName("token_type");
            entity.Property(x => x.IdToken).HasColumnName("id_token");
            entity.Property(x => x.SessionState).HasColumnName("session_state");

            entity.HasOne(x => x.User)
                .WithMany(x => x.Accounts)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Session>(entity =>
        {
            entity.ToTable("sessions");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.SessionToken).IsUnique();
            entity.Property(x => x.SessionToken).HasColumnName("sessionToken");
            entity.Property(x => x.UserId).HasColumnName("userId");

            entity.HasOne(x => x.User)
                .WithMany(x => x.Sessions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VerificationToken>(entity =>
        {
            entity.ToTable("verificationtokens");
            entity.HasKey(x => new { x.Identifier, x.Token });
            entity.HasIndex(x => x.Token).IsUnique();
        });
    }

    private static void ConfigureSettings(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.ToTable("user_settings");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasIndex(x => x.BioUsername).IsUnique();

            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.MaxUploads).HasColumnName("maxUploads");
            entity.Property(x => x.MaxFileSize).HasColumnName("maxFileSize");
            entity.Property(x => x.MaxStorageLimit).HasColumnName("maxStorageLimit");
            entity.Property(x => x.StorageUsed).HasColumnName("storageUsed");
            entity.Property(x => x.MaxShortLinks).HasColumnName("maxShortLinks");
            entity.Property(x => x.UploadDomainId).HasColumnName("uploadDomainId");
            entity.Property(x => x.BioUsername).HasColumnName("bioUsername");

            entity.HasOne(x => x.User)
                .WithOne(x => x.Settings)
                .HasForeignKey<UserSettings>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.UploadDomain)
                .WithMany(x => x.UserSettings)
                .HasForeignKey(x => x.UploadDomainId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    private static void ConfigureUploads(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Upload>(entity =>
        {
            entity.ToTable("uploads");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Url).IsUnique();
            entity.HasIndex(x => x.ShortCode).IsUnique();
            entity.HasIndex(x => x.DeletionKey).IsUnique();

            entity.Property(x => x.OriginalName).HasColumnName("originalName");
            entity.Property(x => x.MimeType).HasColumnName("mimeType");
            entity.Property(x => x.ShortCode).HasColumnName("shortCode");
            entity.Property(x => x.DeletionKey).HasColumnName("deletionKey");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.ExpiresAt).HasColumnName("expiresAt");
            entity.Property(x => x.MaxViews).HasColumnName("maxViews");
            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.LastViewed).HasColumnName("lastViewed");
            entity.Property(x => x.LastDownloaded).HasColumnName("lastDownloaded");

            entity.HasOne(x => x.User)
                .WithMany(x => x.Uploads)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.ToTable("api_keys");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Key).IsUnique();
            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.LastUsed).HasColumnName("lastUsed");
            entity.Property(x => x.IsActive).HasColumnName("isActive");

            entity.HasOne(x => x.User)
                .WithMany(x => x.ApiKeys)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureAnalytics(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DailyAnalytics>(entity =>
        {
            entity.ToTable("daily_analytics");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Date).IsUnique();
            entity.Property(x => x.TotalViews).HasColumnName("totalViews");
            entity.Property(x => x.UniqueViews).HasColumnName("uniqueViews");
            entity.Property(x => x.TotalDownloads).HasColumnName("totalDownloads");
            entity.Property(x => x.UniqueDownloads).HasColumnName("uniqueDownloads");
            entity.Property(x => x.UploadsCount).HasColumnName("uploadsCount");
            entity.Property(x => x.UsersRegistered).HasColumnName("usersRegistered");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.UpdatedAt).HasColumnName("updatedAt");
        });

        modelBuilder.Entity<ViewLog>(entity =>
        {
            entity.ToTable("view_logs");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UploadId);
            entity.HasIndex(x => x.ViewedAt);
            entity.HasIndex(x => new { x.IpAddress, x.UploadId, x.ViewedAt });
            entity.Property(x => x.UploadId).HasColumnName("uploadId");
            entity.Property(x => x.IpAddress).HasColumnName("ipAddress");
            entity.Property(x => x.UserAgent).HasColumnName("userAgent");
            entity.Property(x => x.ViewedAt).HasColumnName("viewedAt");

            entity.HasOne(x => x.Upload)
                .WithMany(x => x.ViewLogs)
                .HasForeignKey(x => x.UploadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DownloadLog>(entity =>
        {
            entity.ToTable("download_logs");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UploadId);
            entity.HasIndex(x => x.DownloadedAt);
            entity.HasIndex(x => new { x.IpAddress, x.UploadId, x.DownloadedAt });
            entity.Property(x => x.UploadId).HasColumnName("uploadId");
            entity.Property(x => x.IpAddress).HasColumnName("ipAddress");
            entity.Property(x => x.UserAgent).HasColumnName("userAgent");
            entity.Property(x => x.DownloadedAt).HasColumnName("downloadedAt");

            entity.HasOne(x => x.Upload)
                .WithMany(x => x.DownloadLogs)
                .HasForeignKey(x => x.UploadId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureDomains(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UploadDomain>(entity =>
        {
            entity.ToTable("upload_domains");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Domain).IsUnique();
            entity.Property(x => x.IsActive).HasColumnName("isActive");
            entity.Property(x => x.IsDefault).HasColumnName("isDefault");
            entity.Property(x => x.SupportsSubdomains).HasColumnName("supportsSubdomains");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.UpdatedAt).HasColumnName("updatedAt");
        });
    }

    private static void ConfigureSystem(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SystemEvent>(entity =>
        {
            entity.ToTable("system_events");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Type);
            entity.HasIndex(x => x.Severity);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.CreatedAt);
            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.CpuUsage).HasColumnName("cpuUsage");
            entity.Property(x => x.MemoryUsage).HasColumnName("memoryUsage");
            entity.Property(x => x.DiskUsage).HasColumnName("diskUsage");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.Metadata).HasColumnType("jsonb");

            entity.HasOne(x => x.User)
                .WithMany(x => x.SystemEvents)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SystemAlert>(entity =>
        {
            entity.ToTable("system_alerts");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasColumnName("eventType");
            entity.Property(x => x.IsActive).HasColumnName("isActive");
            entity.Property(x => x.CooldownMinutes).HasColumnName("cooldownMinutes");
            entity.Property(x => x.NotifyAdmins).HasColumnName("notifyAdmins");
            entity.Property(x => x.NotifyUser).HasColumnName("notifyUser");
            entity.Property(x => x.LastTriggered).HasColumnName("lastTriggered");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.UpdatedAt).HasColumnName("updatedAt");
        });
    }

    private static void ConfigureBio(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BioLink>(entity =>
        {
            entity.ToTable("bio_links");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.Order });
            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.IsActive).HasColumnName("isActive");
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.UpdatedAt).HasColumnName("updatedAt");

            entity.HasOne(x => x.User)
                .WithMany(x => x.BioLinks)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BioView>(entity =>
        {
            entity.ToTable("bio_views");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.ViewedAt);
            entity.HasIndex(x => new { x.IpAddress, x.UserId, x.ViewedAt });
            entity.Property(x => x.UserId).HasColumnName("userId");
            entity.Property(x => x.IpAddress).HasColumnName("ipAddress");
            entity.Property(x => x.UserAgent).HasColumnName("userAgent");
            entity.Property(x => x.ViewedAt).HasColumnName("viewedAt");

            entity.HasOne(x => x.User)
                .WithMany(x => x.BioViewLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureShortLinks(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShortLink>(entity =>
        {
            entity.ToTable("short_links");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.Property(x => x.CreatedAt).HasColumnName("createdAt");
            entity.Property(x => x.ExpiresAt).HasColumnName("expiresAt");
            entity.Property(x => x.MaxClicks).HasColumnName("maxClicks");
            entity.Property(x => x.LastClicked).HasColumnName("lastClicked");
            entity.Property(x => x.UserId).HasColumnName("userId");

            entity.HasOne(x => x.User)
                .WithMany(x => x.ShortLinks)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
