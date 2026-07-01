using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TwinkForSale.Api.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgresSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "daily_analytics",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    totalViews = table.Column<int>(type: "integer", nullable: false),
                    uniqueViews = table.Column<int>(type: "integer", nullable: false),
                    totalDownloads = table.Column<int>(type: "integer", nullable: false),
                    uniqueDownloads = table.Column<int>(type: "integer", nullable: false),
                    uploadsCount = table.Column<int>(type: "integer", nullable: false),
                    usersRegistered = table.Column<int>(type: "integer", nullable: false),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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
                    eventType = table.Column<string>(type: "text", nullable: false),
                    Threshold = table.Column<double>(type: "double precision", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    cooldownMinutes = table.Column<int>(type: "integer", nullable: false),
                    notifyAdmins = table.Column<bool>(type: "boolean", nullable: false),
                    notifyUser = table.Column<bool>(type: "boolean", nullable: false),
                    lastTriggered = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    isDefault = table.Column<bool>(type: "boolean", nullable: false),
                    supportsSubdomains = table.Column<bool>(type: "boolean", nullable: false),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
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
                    name = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: false),
                    emailVerified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    image = table.Column<string>(type: "text", nullable: true),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    isApproved = table.Column<bool>(type: "boolean", nullable: false),
                    isAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    approvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    approvedById = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_users_users_approvedById",
                        column: x => x.approvedById,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "verificationtokens",
                columns: table => new
                {
                    Identifier = table.Column<string>(type: "text", nullable: false),
                    Token = table.Column<string>(type: "text", nullable: false),
                    Expires = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_verificationtokens", x => new { x.Identifier, x.Token });
                });

            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Provider = table.Column<string>(type: "text", nullable: false),
                    providerAccountId = table.Column<string>(type: "text", nullable: false),
                    refresh_token = table.Column<string>(type: "text", nullable: true),
                    access_token = table.Column<string>(type: "text", nullable: true),
                    expires_at = table.Column<int>(type: "integer", nullable: true),
                    token_type = table.Column<string>(type: "text", nullable: true),
                    Scope = table.Column<string>(type: "text", nullable: true),
                    id_token = table.Column<string>(type: "text", nullable: true),
                    session_state = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_accounts_users_userId",
                        column: x => x.userId,
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
                    userId = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    lastUsed = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_keys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_api_keys_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bio_links",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    Clicks = table.Column<int>(type: "integer", nullable: false),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bio_links", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bio_links_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bio_views",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    ipAddress = table.Column<string>(type: "text", nullable: true),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    Referer = table.Column<string>(type: "text", nullable: true),
                    viewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bio_views", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bio_views_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    sessionToken = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    Expires = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sessions_users_userId",
                        column: x => x.userId,
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
                    Url = table.Column<string>(type: "text", nullable: false),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    maxClicks = table.Column<int>(type: "integer", nullable: true),
                    Clicks = table.Column<int>(type: "integer", nullable: false),
                    lastClicked = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    userId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_short_links", x => x.Id);
                    table.ForeignKey(
                        name: "FK_short_links_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
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
                    Metadata = table.Column<string>(type: "jsonb", nullable: true),
                    userId = table.Column<string>(type: "text", nullable: true),
                    cpuUsage = table.Column<double>(type: "double precision", nullable: true),
                    memoryUsage = table.Column<double>(type: "double precision", nullable: true),
                    diskUsage = table.Column<double>(type: "double precision", nullable: true),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_system_events_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "uploads",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Filename = table.Column<string>(type: "text", nullable: false),
                    originalName = table.Column<string>(type: "text", nullable: false),
                    mimeType = table.Column<string>(type: "text", nullable: false),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    shortCode = table.Column<string>(type: "text", nullable: false),
                    deletionKey = table.Column<string>(type: "text", nullable: false),
                    Width = table.Column<int>(type: "integer", nullable: true),
                    Height = table.Column<int>(type: "integer", nullable: true),
                    createdAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    expiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    maxViews = table.Column<int>(type: "integer", nullable: true),
                    userId = table.Column<string>(type: "text", nullable: true),
                    Views = table.Column<int>(type: "integer", nullable: false),
                    Downloads = table.Column<int>(type: "integer", nullable: false),
                    lastViewed = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lastDownloaded = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_uploads", x => x.Id);
                    table.ForeignKey(
                        name: "FK_uploads_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_settings",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    userId = table.Column<string>(type: "text", nullable: false),
                    maxUploads = table.Column<int>(type: "integer", nullable: false),
                    maxFileSize = table.Column<long>(type: "bigint", nullable: false),
                    maxStorageLimit = table.Column<long>(type: "bigint", nullable: true),
                    storageUsed = table.Column<long>(type: "bigint", nullable: false),
                    maxShortLinks = table.Column<int>(type: "integer", nullable: false),
                    EmbedTitle = table.Column<string>(type: "text", nullable: true),
                    EmbedDescription = table.Column<string>(type: "text", nullable: true),
                    EmbedColor = table.Column<string>(type: "text", nullable: true),
                    EmbedAuthor = table.Column<string>(type: "text", nullable: true),
                    EmbedFooter = table.Column<string>(type: "text", nullable: true),
                    ShowFileInfo = table.Column<bool>(type: "boolean", nullable: false),
                    ShowUploadDate = table.Column<bool>(type: "boolean", nullable: false),
                    ShowUserStats = table.Column<bool>(type: "boolean", nullable: false),
                    CustomDomain = table.Column<string>(type: "text", nullable: true),
                    uploadDomainId = table.Column<string>(type: "text", nullable: true),
                    CustomSubdomain = table.Column<string>(type: "text", nullable: true),
                    UseCustomWords = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultExpirationDays = table.Column<int>(type: "integer", nullable: true),
                    DefaultMaxViews = table.Column<int>(type: "integer", nullable: true),
                    GlobalParticleConfig = table.Column<string>(type: "text", nullable: true),
                    bioUsername = table.Column<string>(type: "text", nullable: true),
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
                    BioLastViewed = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
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
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user_settings_upload_domains_uploadDomainId",
                        column: x => x.uploadDomainId,
                        principalTable: "upload_domains",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_user_settings_users_userId",
                        column: x => x.userId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "download_logs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    uploadId = table.Column<string>(type: "text", nullable: false),
                    ipAddress = table.Column<string>(type: "text", nullable: true),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    Referer = table.Column<string>(type: "text", nullable: true),
                    downloadedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_download_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_download_logs_uploads_uploadId",
                        column: x => x.uploadId,
                        principalTable: "uploads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "view_logs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    uploadId = table.Column<string>(type: "text", nullable: false),
                    ipAddress = table.Column<string>(type: "text", nullable: true),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    Referer = table.Column<string>(type: "text", nullable: true),
                    viewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_view_logs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_view_logs_uploads_uploadId",
                        column: x => x.uploadId,
                        principalTable: "uploads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_accounts_Provider_providerAccountId",
                table: "accounts",
                columns: new[] { "Provider", "providerAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_accounts_userId",
                table: "accounts",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_Key",
                table: "api_keys",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_userId",
                table: "api_keys",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_bio_links_userId_Order",
                table: "bio_links",
                columns: new[] { "userId", "Order" });

            migrationBuilder.CreateIndex(
                name: "IX_bio_views_ipAddress_userId_viewedAt",
                table: "bio_views",
                columns: new[] { "ipAddress", "userId", "viewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_bio_views_userId",
                table: "bio_views",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_bio_views_viewedAt",
                table: "bio_views",
                column: "viewedAt");

            migrationBuilder.CreateIndex(
                name: "IX_daily_analytics_Date",
                table: "daily_analytics",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_download_logs_downloadedAt",
                table: "download_logs",
                column: "downloadedAt");

            migrationBuilder.CreateIndex(
                name: "IX_download_logs_ipAddress_uploadId_downloadedAt",
                table: "download_logs",
                columns: new[] { "ipAddress", "uploadId", "downloadedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_download_logs_uploadId",
                table: "download_logs",
                column: "uploadId");

            migrationBuilder.CreateIndex(
                name: "IX_sessions_sessionToken",
                table: "sessions",
                column: "sessionToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sessions_userId",
                table: "sessions",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_short_links_Code",
                table: "short_links",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_short_links_userId",
                table: "short_links",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_createdAt",
                table: "system_events",
                column: "createdAt");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_Severity",
                table: "system_events",
                column: "Severity");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_Type",
                table: "system_events",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_system_events_userId",
                table: "system_events",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_upload_domains_Domain",
                table: "upload_domains",
                column: "Domain",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_deletionKey",
                table: "uploads",
                column: "deletionKey",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_shortCode",
                table: "uploads",
                column: "shortCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_Url",
                table: "uploads",
                column: "Url",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_uploads_userId",
                table: "uploads",
                column: "userId");

            migrationBuilder.CreateIndex(
                name: "IX_user_settings_bioUsername",
                table: "user_settings",
                column: "bioUsername",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_settings_uploadDomainId",
                table: "user_settings",
                column: "uploadDomainId");

            migrationBuilder.CreateIndex(
                name: "IX_user_settings_userId",
                table: "user_settings",
                column: "userId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_approvedById",
                table: "users",
                column: "approvedById");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_verificationtokens_Token",
                table: "verificationtokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_view_logs_ipAddress_uploadId_viewedAt",
                table: "view_logs",
                columns: new[] { "ipAddress", "uploadId", "viewedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_view_logs_uploadId",
                table: "view_logs",
                column: "uploadId");

            migrationBuilder.CreateIndex(
                name: "IX_view_logs_viewedAt",
                table: "view_logs",
                column: "viewedAt");
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
                name: "daily_analytics");

            migrationBuilder.DropTable(
                name: "download_logs");

            migrationBuilder.DropTable(
                name: "sessions");

            migrationBuilder.DropTable(
                name: "short_links");

            migrationBuilder.DropTable(
                name: "system_alerts");

            migrationBuilder.DropTable(
                name: "system_events");

            migrationBuilder.DropTable(
                name: "user_settings");

            migrationBuilder.DropTable(
                name: "verificationtokens");

            migrationBuilder.DropTable(
                name: "view_logs");

            migrationBuilder.DropTable(
                name: "upload_domains");

            migrationBuilder.DropTable(
                name: "uploads");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
