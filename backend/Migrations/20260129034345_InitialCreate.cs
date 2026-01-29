using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TwinkForSale.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "daily_analytics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TotalViews = table.Column<int>(type: "integer", nullable: false),
                    UniqueViews = table.Column<int>(type: "integer", nullable: false),
                    TotalDownloads = table.Column<int>(type: "integer", nullable: false),
                    UniqueDownloads = table.Column<int>(type: "integer", nullable: false),
                    UploadsCount = table.Column<int>(type: "integer", nullable: false),
                    UsersRegistered = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_daily_analytics", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "system_alerts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    Threshold = table.Column<double>(type: "double precision", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CooldownMinutes = table.Column<int>(type: "integer", nullable: false),
                    NotifyAdmins = table.Column<bool>(type: "boolean", nullable: false),
                    NotifyUser = table.Column<bool>(type: "boolean", nullable: false),
                    LastTriggered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_alerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "upload_domains",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Domain = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    SupportsSubdomains = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_upload_domains", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: false),
                    EmailVerified = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Image = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsApproved = table.Column<bool>(type: "boolean", nullable: false),
                    IsAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ApprovedById = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_users_users_ApprovedById",
                        column: x => x.ApprovedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    ProviderAccountId = table.Column<string>(type: "text", nullable: false),
                    RefreshToken = table.Column<string>(type: "text", nullable: true),
                    AccessToken = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<int>(type: "integer", nullable: true),
                    TokenType = table.Column<string>(type: "text", nullable: true),
                    Scope = table.Column<string>(type: "text", nullable: true),
                    IdToken = table.Column<string>(type: "text", nullable: true),
                    SessionState = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_accounts_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "api_keys",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastUsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_keys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_api_keys_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bio_links",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Clicks = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bio_links", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bio_links_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bio_views",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    Referer = table.Column<string>(type: "text", nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bio_views", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bio_views_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "short_links",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    TargetUrl = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxClicks = table.Column<int>(type: "integer", nullable: true),
                    ClickCount = table.Column<int>(type: "integer", nullable: false),
                    LastClickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_short_links", x => x.Id);
                    table.ForeignKey(
                        name: "FK_short_links_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "system_events",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    Metadata = table.Column<string>(type: "text", nullable: true),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    CpuUsage = table.Column<double>(type: "double precision", nullable: true),
                    MemoryUsage = table.Column<double>(type: "double precision", nullable: true),
                    DiskUsage = table.Column<double>(type: "double precision", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_system_events_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "uploads",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    OriginalName = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    ShortCode = table.Column<string>(type: "text", nullable: false),
                    DeletionKey = table.Column<string>(type: "text", nullable: false),
                    StoragePath = table.Column<string>(type: "text", nullable: false),
                    ThumbnailPath = table.Column<string>(type: "text", nullable: true),
                    Width = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MaxViews = table.Column<int>(type: "integer", nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    ViewCount = table.Column<int>(type: "integer", nullable: false),
                    DownloadCount = table.Column<int>(type: "integer", nullable: false),
                    LastViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastDownloadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_uploads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_uploads_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_settings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    MaxUploads = table.Column<int>(type: "integer", nullable: false),
                    MaxFileSize = table.Column<long>(type: "bigint", nullable: false),
                    MaxStorageLimit = table.Column<long>(type: "bigint", nullable: true),
                    StorageUsed = table.Column<long>(type: "bigint", nullable: false),
                    MaxShortLinks = table.Column<int>(type: "integer", nullable: false),
                    EmbedTitle = table.Column<string>(type: "text", nullable: true),
                    EmbedDescription = table.Column<string>(type: "text", nullable: true),
                    EmbedColor = table.Column<string>(type: "text", nullable: true),
                    EmbedAuthor = table.Column<string>(type: "text", nullable: true),
                    EmbedFooter = table.Column<string>(type: "text", nullable: true),
                    ShowFileInfo = table.Column<bool>(type: "boolean", nullable: false),
                    ShowUploadDate = table.Column<bool>(type: "boolean", nullable: false),
                    ShowUserStats = table.Column<bool>(type: "boolean", nullable: false),
                    CustomDomain = table.Column<string>(type: "text", nullable: true),
                    UploadDomainId = table.Column<string>(type: "text", nullable: true),
                    CustomSubdomain = table.Column<string>(type: "text", nullable: true),
                    UseCustomWords = table.Column<bool>(type: "boolean", nullable: false),
                    CustomWords = table.Column<string>(type: "text", nullable: true),
                    DefaultExpirationDays = table.Column<int>(type: "integer", nullable: true),
                    DefaultMaxViews = table.Column<int>(type: "integer", nullable: true),
                    GlobalParticleConfig = table.Column<string>(type: "text", nullable: true),
                    BioUsername = table.Column<string>(type: "text", nullable: true),
                    BioDisplayName = table.Column<string>(type: "text", nullable: true),
                    BioDescription = table.Column<string>(type: "text", nullable: true),
                    BioProfileImage = table.Column<string>(type: "text", nullable: true),
                    BioBackgroundImage = table.Column<string>(type: "text", nullable: true),
                    BioBackgroundColor = table.Column<string>(type: "text", nullable: true),
                    BioTextColor = table.Column<string>(type: "text", nullable: true),
                    BioAccentColor = table.Column<string>(type: "text", nullable: true),
                    BioCustomCss = table.Column<string>(type: "text", nullable: true),
                    BioSpotifyTrack = table.Column<string>(type: "text", nullable: true),
                    BioIsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    BioViews = table.Column<int>(type: "integer", nullable: false),
                    BioLastViewed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BioGradientConfig = table.Column<string>(type: "text", nullable: true),
                    BioParticleConfig = table.Column<string>(type: "text", nullable: true),
                    BioDiscordUserId = table.Column<string>(type: "text", nullable: true),
                    BioShowDiscord = table.Column<bool>(type: "boolean", nullable: false),
                    BioDiscordConfig = table.Column<string>(type: "text", nullable: true),
                    MaxBioLinks = table.Column<int>(type: "integer", nullable: true),
                    MaxUsernameLength = table.Column<int>(type: "integer", nullable: true),
                    MaxDisplayNameLength = table.Column<int>(type: "integer", nullable: true),
                    MaxDescriptionLength = table.Column<int>(type: "integer", nullable: true),
                    MaxUrlLength = table.Column<int>(type: "integer", nullable: true),
                    MaxLinkTitleLength = table.Column<int>(type: "integer", nullable: true),
                    MaxIconLength = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_settings_upload_domains_UploadDomainId",
                        column: x => x.UploadDomainId,
                        principalTable: "upload_domains",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_settings_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "click_logs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ShortLinkId = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    Referrer = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    ClickedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_click_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_click_logs_short_links_ShortLinkId",
                        column: x => x.ShortLinkId,
                        principalTable: "short_links",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "download_logs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UploadId = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    Referer = table.Column<string>(type: "text", nullable: true),
                    DownloadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_download_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_download_logs_uploads_UploadId",
                        column: x => x.UploadId,
                        principalTable: "uploads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "view_logs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UploadId = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    Referrer = table.Column<string>(type: "text", nullable: true),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_view_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_view_logs_uploads_UploadId",
                        column: x => x.UploadId,
                        principalTable: "uploads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_accounts_Provider_ProviderAccountId",
                table: "accounts",
                columns: new[] { "Provider", "ProviderAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_accounts_UserId",
                table: "accounts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_Key",
                table: "api_keys",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_UserId",
                table: "api_keys",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_bio_links_UserId_Order",
                table: "bio_links",
                columns: new[] { "UserId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_bio_views_IpAddress_UserId_ViewedAt",
                table: "bio_views",
                columns: new[] { "IpAddress", "UserId", "ViewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_bio_views_UserId",
                table: "bio_views",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_bio_views_ViewedAt",
                table: "bio_views",
                column: "ViewedAt");

            migrationBuilder.CreateIndex(
                name: "IX_click_logs_ClickedAt",
                table: "click_logs",
                column: "ClickedAt");

            migrationBuilder.CreateIndex(
                name: "IX_click_logs_ShortLinkId",
                table: "click_logs",
                column: "ShortLinkId");

            migrationBuilder.CreateIndex(
                name: "IX_daily_analytics_Date",
                table: "daily_analytics",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_download_logs_DownloadedAt",
                table: "download_logs",
                column: "DownloadedAt");

            migrationBuilder.CreateIndex(
                name: "IX_download_logs_IpAddress_UploadId_DownloadedAt",
                table: "download_logs",
                columns: new[] { "IpAddress", "UploadId", "DownloadedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_download_logs_UploadId",
                table: "download_logs",
                column: "UploadId");

            migrationBuilder.CreateIndex(
                name: "IX_short_links_Code",
                table: "short_links",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_short_links_UserId",
                table: "short_links",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_CreatedAt",
                table: "system_events",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_Severity",
                table: "system_events",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_Type",
                table: "system_events",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_UserId",
                table: "system_events",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_upload_domains_Domain",
                table: "upload_domains",
                column: "Domain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_DeletionKey",
                table: "uploads",
                column: "DeletionKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_ShortCode",
                table: "uploads",
                column: "ShortCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_Url",
                table: "uploads",
                column: "Url",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_UserId",
                table: "uploads",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_user_settings_BioUsername",
                table: "user_settings",
                column: "BioUsername",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_settings_UploadDomainId",
                table: "user_settings",
                column: "UploadDomainId");

            migrationBuilder.CreateIndex(
                name: "IX_user_settings_UserId",
                table: "user_settings",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_ApprovedById",
                table: "users",
                column: "ApprovedById");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_view_logs_IpAddress_UploadId_ViewedAt",
                table: "view_logs",
                columns: new[] { "IpAddress", "UploadId", "ViewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_view_logs_UploadId",
                table: "view_logs",
                column: "UploadId");

            migrationBuilder.CreateIndex(
                name: "IX_view_logs_ViewedAt",
                table: "view_logs",
                column: "ViewedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "accounts");

            migrationBuilder.DropTable(
                name: "api_keys");

            migrationBuilder.DropTable(
                name: "bio_links");

            migrationBuilder.DropTable(
                name: "bio_views");

            migrationBuilder.DropTable(
                name: "click_logs");

            migrationBuilder.DropTable(
                name: "daily_analytics");

            migrationBuilder.DropTable(
                name: "download_logs");

            migrationBuilder.DropTable(
                name: "system_alerts");

            migrationBuilder.DropTable(
                name: "system_events");

            migrationBuilder.DropTable(
                name: "user_settings");

            migrationBuilder.DropTable(
                name: "view_logs");

            migrationBuilder.DropTable(
                name: "short_links");

            migrationBuilder.DropTable(
                name: "upload_domains");

            migrationBuilder.DropTable(
                name: "uploads");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
