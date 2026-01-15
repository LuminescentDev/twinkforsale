using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Upload> Uploads => Set<Upload>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<ShortLink> ShortLinks => Set<ShortLink>();
    public DbSet<BioLink> BioLinks => Set<BioLink>();
    public DbSet<BioView> BioViews => Set<BioView>();
    public DbSet<ViewLog> ViewLogs => Set<ViewLog>();
    public DbSet<DownloadLog> DownloadLogs => Set<DownloadLog>();
    public DbSet<UploadDomain> UploadDomains => Set<UploadDomain>();
    public DbSet<DailyAnalytics> DailyAnalytics => Set<DailyAnalytics>();
    public DbSet<SystemEvent> SystemEvents => Set<SystemEvent>();
    public DbSet<SystemAlert> SystemAlerts => Set<SystemAlert>();
    public DbSet<ClickLog> ClickLogs => Set<ClickLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasOne(e => e.ApprovedBy)
                .WithMany(e => e.ApprovedUsers)
                .HasForeignKey(e => e.ApprovedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // UserSettings
        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.ToTable("user_settings");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.HasIndex(e => e.BioUsername).IsUnique();
            entity.HasOne(e => e.User)
                .WithOne(e => e.Settings)
                .HasForeignKey<UserSettings>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.UploadDomain)
                .WithMany(e => e.UserSettings)
                .HasForeignKey(e => e.UploadDomainId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Account
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.Provider, e.ProviderAccountId }).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(e => e.Accounts)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Upload
        modelBuilder.Entity<Upload>(entity =>
        {
            entity.ToTable("uploads");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Url).IsUnique();
            entity.HasIndex(e => e.ShortCode).IsUnique();
            entity.HasIndex(e => e.DeletionKey).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(e => e.Uploads)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ApiKey
        modelBuilder.Entity<ApiKey>(entity =>
        {
            entity.ToTable("api_keys");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Key).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(e => e.ApiKeys)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ShortLink
        modelBuilder.Entity<ShortLink>(entity =>
        {
            entity.ToTable("short_links");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(e => e.ShortLinks)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ClickLog
        modelBuilder.Entity<ClickLog>(entity =>
        {
            entity.ToTable("click_logs");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ShortLinkId);
            entity.HasIndex(e => e.ClickedAt);
            entity.HasOne(e => e.ShortLink)
                .WithMany(e => e.ClickLogs)
                .HasForeignKey(e => e.ShortLinkId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BioLink
        modelBuilder.Entity<BioLink>(entity =>
        {
            entity.ToTable("bio_links");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Order });
            entity.HasOne(e => e.User)
                .WithMany(e => e.BioLinks)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // BioView
        modelBuilder.Entity<BioView>(entity =>
        {
            entity.ToTable("bio_views");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ViewedAt);
            entity.HasIndex(e => new { e.IpAddress, e.UserId, e.ViewedAt });
            entity.HasOne(e => e.User)
                .WithMany(e => e.BioViews)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ViewLog
        modelBuilder.Entity<ViewLog>(entity =>
        {
            entity.ToTable("view_logs");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UploadId);
            entity.HasIndex(e => e.ViewedAt);
            entity.HasIndex(e => new { e.IpAddress, e.UploadId, e.ViewedAt });
            entity.HasOne(e => e.Upload)
                .WithMany(e => e.ViewLogs)
                .HasForeignKey(e => e.UploadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DownloadLog
        modelBuilder.Entity<DownloadLog>(entity =>
        {
            entity.ToTable("download_logs");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UploadId);
            entity.HasIndex(e => e.DownloadedAt);
            entity.HasIndex(e => new { e.IpAddress, e.UploadId, e.DownloadedAt });
            entity.HasOne(e => e.Upload)
                .WithMany(e => e.DownloadLogs)
                .HasForeignKey(e => e.UploadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UploadDomain
        modelBuilder.Entity<UploadDomain>(entity =>
        {
            entity.ToTable("upload_domains");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Domain).IsUnique();
        });

        // DailyAnalytics
        modelBuilder.Entity<DailyAnalytics>(entity =>
        {
            entity.ToTable("daily_analytics");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Date).IsUnique();
        });

        // SystemEvent
        modelBuilder.Entity<SystemEvent>(entity =>
        {
            entity.ToTable("system_events");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.Severity);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasOne(e => e.User)
                .WithMany(e => e.SystemEvents)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // SystemAlert
        modelBuilder.Entity<SystemAlert>(entity =>
        {
            entity.ToTable("system_alerts");
            entity.HasKey(e => e.Id);
        });
    }
}
