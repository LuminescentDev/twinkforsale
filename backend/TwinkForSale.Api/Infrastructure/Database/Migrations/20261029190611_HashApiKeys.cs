using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TwinkForSale.Api.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class HashApiKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MaskedKey",
                table: "api_keys",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE api_keys
                SET "MaskedKey" = CASE WHEN length("Key") <= 8 THEN '********'
                    ELSE left("Key", 4) || '...' || right("Key", 4) END,
                    "Key" = encode(sha256(convert_to("Key", 'UTF8')), 'hex');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("API key hashing cannot be reversed. Restore a pre-migration backup to downgrade.");
        }
    }
}
