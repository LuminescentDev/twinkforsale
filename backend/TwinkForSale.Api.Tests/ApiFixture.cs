using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Configuration;
using Npgsql;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Database;
using Xunit;

namespace TwinkForSale.Api.Tests;

public sealed class ApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string databaseName = $"tfs_tests_{Guid.NewGuid():N}";
    private readonly string storagePath = Path.Combine(Path.GetTempPath(), $"tfs-tests-{Guid.NewGuid():N}");
    private string adminConnection = string.Empty;
    private string connectionString = string.Empty;
    public string LegacyKey { get; } = Guid.NewGuid().ToString("N");
    public string LegacyUserId { get; } = Guid.NewGuid().ToString("N");
    public string LegacyUploadId { get; } = Guid.NewGuid().ToString("N");
    public string StoragePath => storagePath;

    public async Task InitializeAsync()
    {
        adminConnection = Environment.GetEnvironmentVariable("TFS_TEST_POSTGRES")
            ?? throw new InvalidOperationException("Set TFS_TEST_POSTGRES to an isolated PostgreSQL instance. Tests create and drop their own tfs_tests_* database.");
        await using var connection = new NpgsqlConnection(adminConnection);
        await connection.OpenAsync();
        await using var create = new NpgsqlCommand($"CREATE DATABASE {databaseName}", connection);
        await create.ExecuteNonQueryAsync();
        connectionString = new NpgsqlConnectionStringBuilder(adminConnection) { Database = databaseName }.ConnectionString;

        await using var db = CreateDbContext();
        await db.GetService<IMigrator>().MigrateAsync("20260701055351_InitialPostgresSchema");
        db.Users.Add(new User { Id = LegacyUserId, Email = $"{LegacyUserId}@example.test", IsApproved = true });
        await db.SaveChangesAsync();
        var id = Guid.NewGuid().ToString("N");
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO api_keys ("Id", "Key", "Name", "userId", "createdAt", "isActive")
            VALUES ({id}, {LegacyKey}, 'legacy', {LegacyUserId}, {DateTimeOffset.UtcNow}, true)
            """);
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO uploads ("Id", "Filename", "originalName", "mimeType", "Size", "Url", "shortCode", "deletionKey", "createdAt", "Views", "Downloads", "userId")
            VALUES ({LegacyUploadId}, 'legacy-fixture', 'legacy.txt', 'text/plain', 1, {"http://localhost/f/" + LegacyUploadId}, {LegacyUploadId}, {LegacyUploadId}, {DateTimeOffset.UtcNow}, 0, 0, {LegacyUserId})
            """);
        await db.Database.MigrateAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Default"] = connectionString,
            ["App:BaseUrl"] = "http://localhost",
            ["Storage:Provider"] = "Local",
            ["Storage:LocalPath"] = storagePath
        }));
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
        });
    }

    public AppDbContext CreateDbContext() => new(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connectionString).Options);

    public async Task<(HttpClient Client, string UserId)> CreateUserAsync(int maxUploads = 100, long storageLimit = 1_000_000)
    {
        await using var db = CreateDbContext();
        var user = new User { Email = $"{Guid.NewGuid():N}@example.test", IsApproved = true };
        user.Settings = new UserSettings { UserId = user.Id, MaxUploads = maxUploads, MaxStorageLimit = storageLimit };
        var token = Guid.NewGuid().ToString("N");
        user.Sessions.Add(new Session { SessionToken = token, Expires = DateTimeOffset.UtcNow.AddDays(1), UserId = user.Id });
        db.Users.Add(user);
        await db.SaveChangesAsync();
        var client = CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("Cookie", $"{BrowserSessionDefaults.SessionCookieName}={token}");
        return (client, user.Id);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        NpgsqlConnection.ClearAllPools();
        if (!string.IsNullOrEmpty(connectionString))
        {
            await using var connection = new NpgsqlConnection(adminConnection);
            await connection.OpenAsync();
            await using var drop = new NpgsqlCommand($"DROP DATABASE {databaseName} WITH (FORCE)", connection);
            await drop.ExecuteNonQueryAsync();
        }
        if (Directory.Exists(storagePath)) Directory.Delete(storagePath, recursive: true);
    }
}
