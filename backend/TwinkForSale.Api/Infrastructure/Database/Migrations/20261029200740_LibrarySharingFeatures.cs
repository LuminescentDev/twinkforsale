using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TwinkForSale.Api.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class LibrarySharingFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_uploads_userId",
                table: "uploads");

            migrationBuilder.AddColumn<string>(
                name: "AccessMode",
                table: "uploads",
                type: "text",
                nullable: false,
                defaultValue: "public");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletedAt",
                table: "uploads",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DisplayName",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmbedColor",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmbedDescription",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmbedTitle",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileRequestId",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFavorite",
                table: "uploads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPending",
                table: "uploads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRevoked",
                table: "uploads",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "uploads",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string[]>(
                name: "Tags",
                table: "uploads",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);

            migrationBuilder.AddColumn<bool>(
                name: "IsPaused",
                table: "short_links",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "albums",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ShowOnBio = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_albums", x => x.Id);
                    table.ForeignKey(
                        name: "FK_albums_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bio_drafts",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Document = table.Column<string>(type: "jsonb", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bio_drafts", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_bio_drafts_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "bio_revisions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Document = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bio_revisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bio_revisions_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saved_filters",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Search = table.Column<string>(type: "text", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Tag = table.Column<string>(type: "text", nullable: true),
                    FavoritesOnly = table.Column<bool>(type: "boolean", nullable: false),
                    Period = table.Column<string>(type: "text", nullable: false),
                    Sort = table.Column<string>(type: "text", nullable: false),
                    Direction = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_saved_filters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_saved_filters_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "short_link_revisions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ShortLinkId = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    ChangedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_short_link_revisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_short_link_revisions_short_links_ShortLinkId",
                        column: x => x.ShortLinkId,
                        principalTable: "short_links",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "upload_presets",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    UploadDomainId = table.Column<string>(type: "text", nullable: true),
                    ExpirationDays = table.Column<int>(type: "integer", nullable: true),
                    MaxViews = table.Column<int>(type: "integer", nullable: true),
                    EmbedTitle = table.Column<string>(type: "text", nullable: true),
                    EmbedDescription = table.Column<string>(type: "text", nullable: true),
                    EmbedColor = table.Column<string>(type: "text", nullable: true),
                    StripMetadata = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_upload_presets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_upload_presets_upload_domains_UploadDomainId",
                        column: x => x.UploadDomainId,
                        principalTable: "upload_domains",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_upload_presets_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "album_uploads",
                columns: table => new
                {
                    AlbumId = table.Column<string>(type: "text", nullable: false),
                    UploadId = table.Column<string>(type: "text", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_album_uploads", x => new { x.AlbumId, x.UploadId });
                    table.ForeignKey(
                        name: "FK_album_uploads_albums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "albums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_album_uploads_uploads_UploadId",
                        column: x => x.UploadId,
                        principalTable: "uploads",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "file_requests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    AlbumId = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    MaxFiles = table.Column<int>(type: "integer", nullable: false),
                    MaxFileSize = table.Column<long>(type: "bigint", nullable: false),
                    SubmittedCount = table.Column<int>(type: "integer", nullable: false),
                    IsClosed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_file_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_file_requests_albums_AlbumId",
                        column: x => x.AlbumId,
                        principalTable: "albums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_file_requests_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_uploads_FileRequestId",
                table: "uploads",
                column: "FileRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_uploads_userId_DeletedAt",
                table: "uploads",
                columns: new[] { "userId", "DeletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_album_uploads_UploadId",
                table: "album_uploads",
                column: "UploadId");

            migrationBuilder.CreateIndex(
                name: "IX_albums_Code",
                table: "albums",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_albums_UserId",
                table: "albums",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_bio_revisions_UserId_CreatedAt",
                table: "bio_revisions",
                columns: new[] { "UserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_file_requests_AlbumId",
                table: "file_requests",
                column: "AlbumId");

            migrationBuilder.CreateIndex(
                name: "IX_file_requests_Code",
                table: "file_requests",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_file_requests_UserId",
                table: "file_requests",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_saved_filters_UserId",
                table: "saved_filters",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_short_link_revisions_ShortLinkId",
                table: "short_link_revisions",
                column: "ShortLinkId");

            migrationBuilder.CreateIndex(
                name: "IX_upload_presets_UploadDomainId",
                table: "upload_presets",
                column: "UploadDomainId");

            migrationBuilder.CreateIndex(
                name: "IX_upload_presets_UserId",
                table: "upload_presets",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_uploads_file_requests_FileRequestId",
                table: "uploads",
                column: "FileRequestId",
                principalTable: "file_requests",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_uploads_file_requests_FileRequestId",
                table: "uploads");

            migrationBuilder.DropTable(
                name: "album_uploads");

            migrationBuilder.DropTable(
                name: "bio_drafts");

            migrationBuilder.DropTable(
                name: "bio_revisions");

            migrationBuilder.DropTable(
                name: "file_requests");

            migrationBuilder.DropTable(
                name: "saved_filters");

            migrationBuilder.DropTable(
                name: "short_link_revisions");

            migrationBuilder.DropTable(
                name: "upload_presets");

            migrationBuilder.DropTable(
                name: "albums");

            migrationBuilder.DropIndex(
                name: "IX_uploads_FileRequestId",
                table: "uploads");

            migrationBuilder.DropIndex(
                name: "IX_uploads_userId_DeletedAt",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "AccessMode",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "DisplayName",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "EmbedColor",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "EmbedDescription",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "EmbedTitle",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "FileRequestId",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "IsFavorite",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "IsPending",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "IsRevoked",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "uploads");

            migrationBuilder.DropColumn(
                name: "IsPaused",
                table: "short_links");

            migrationBuilder.CreateIndex(
                name: "IX_uploads_userId",
                table: "uploads",
                column: "userId");
        }
    }
}
