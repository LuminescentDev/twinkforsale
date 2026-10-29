using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Domain.Entities;
using TwinkForSale.Api.Features.Uploads.Get;
using TwinkForSale.Api.Features.Uploads.Post;
using TwinkForSale.Api.Infrastructure.Auth;
using Xunit;

namespace TwinkForSale.Api.Tests;

public sealed class SharingTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task FailedDatabaseWritesRemoveUploadedBytesAndDoNotExposeInternalErrors()
    {
        var (owner, userId) = await fixture.CreateUserAsync();
        await using var db = fixture.CreateDbContext();
        await db.Database.ExecuteSqlRawAsync("""
            CREATE FUNCTION reject_test_upload() RETURNS trigger AS $$
            BEGIN RAISE EXCEPTION 'internal fixture failure'; END;
            $$ LANGUAGE plpgsql;
            CREATE TRIGGER reject_test_upload BEFORE INSERT ON uploads FOR EACH ROW EXECUTE FUNCTION reject_test_upload();
            """);
        try
        {
            using var result = await PostUploadAsync(owner);
            Assert.Equal(HttpStatusCode.InternalServerError, result.StatusCode);
            Assert.DoesNotContain("internal fixture failure", await result.Content.ReadAsStringAsync());
            Assert.False(await db.Uploads.AnyAsync(x => x.UserId == userId));
            Assert.Empty(Directory.EnumerateFiles(Path.Combine(fixture.StoragePath, userId)));
            Assert.Equal(0, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.StorageUsed).SingleAsync());
        }
        finally
        {
            await db.Database.ExecuteSqlRawAsync("DROP TRIGGER reject_test_upload ON uploads; DROP FUNCTION reject_test_upload();");
        }
    }

    [Fact]
    public async Task ShareXDeletionUrlRequiresConfirmationAndReleasesStorage()
    {
        var (owner, userId) = await fixture.CreateUserAsync();
        using var created = await PostUploadAsync(owner);
        var body = await created.Content.ReadFromJsonAsync<CreateUploadResponse>();
        var deletePath = new Uri(body!.DeletionUrl!).PathAndQuery;
        using var visitor = fixture.CreateClient();
        var confirmation = await visitor.GetAsync(deletePath);
        Assert.Equal(HttpStatusCode.OK, confirmation.StatusCode);
        Assert.Contains("form method=\"post\"", await confirmation.Content.ReadAsStringAsync());
        await using var db = fixture.CreateDbContext();
        Assert.True(await db.Uploads.AnyAsync(x => x.UserId == userId));
        Assert.Equal(HttpStatusCode.OK, (await visitor.PostAsync(deletePath, null)).StatusCode);
        Assert.False(await db.Uploads.AnyAsync(x => x.UserId == userId));
        Assert.Equal(0, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.StorageUsed).SingleAsync());
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(new Uri(body.Url!).PathAndQuery)).StatusCode);
    }

    [Fact]
    public async Task ConcurrentUploadsCannotExceedStorageLimit()
    {
        var (owner, userId) = await fixture.CreateUserAsync(storageLimit: 5);
        var results = await Task.WhenAll(Enumerable.Range(0, 6).Select(_ => PostUploadAsync(owner)));
        Assert.Single(results, x => x.StatusCode == HttpStatusCode.Created);
        Assert.Equal(5, results.Count(x => x.StatusCode == HttpStatusCode.RequestEntityTooLarge));
        await using var db = fixture.CreateDbContext();
        Assert.Equal(4, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.StorageUsed).SingleAsync());
    }

    [Theory]
    [InlineData("image/png", "iVBORw0KGgoAAAANSUhEUgAAAA0AAAAHCAIAAABcElBNAAAAFUlEQVR4nGMU0bBhIAIwEaNoGKkDAIroAIYFYU6OAAAAAElFTkSuQmCC")]
    [InlineData("image/gif", "R0lGODdhDQAHAIEAABQoPAAAAAAAAAAAACwAAAAADQAHAAAIEQABCBxIsKDBgwgTKlzIsGFAADs=")]
    [InlineData("image/jpeg", "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAHAA0DASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDyOiiiuw5D/9k=")]
    [InlineData("image/webp", "UklGRjAAAABXRUJQVlA4ICQAAABQAQCdASoNAAcAAUAmJQBOgCgAAP76id+R2EN2HLri5shvAAA=")]
    [InlineData("image/bmp", "Qk1OAQAAAAAAADYAAAAoAAAADQAAAAcAAAABABgAAAAAABgBAADEDgAAxA4AAAAAAAAAAAAAPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUADwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFAA8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQAPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUADwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFDwoFAA8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQ8KBQAPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUPCgUAA==")]
    [InlineData("image/tiff", "SUkqAAgAAAAKAAABBAABAAAADQAAAAEBBAABAAAABwAAAAIBAwADAAAAhgAAAAMBAwABAAAAAQAAAAYBAwABAAAAAgAAABEBBAABAAAAjAAAABUBAwABAAAAAwAAABYBBAABAAAABwAAABcBBAABAAAAEQEAABwBAwABAAAAAQAAAAAAAAAIAAgACAAUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDwUKDw=")]
    public async Task ImageDimensionsAreReadWithoutDecodingPixels(string mime, string encoded)
    {
        var (owner, userId) = await fixture.CreateUserAsync();
        await UploadAsync(owner, mime: mime, bytes: Convert.FromBase64String(encoded));
        await using var db = fixture.CreateDbContext();
        var upload = await db.Uploads.SingleAsync(x => x.UserId == userId);
        Assert.Equal(13, upload.Width);
        Assert.Equal(7, upload.Height);
    }

    [Fact]
    public async Task ExistingAndNewKeysAuthenticateWithoutStoringSecrets()
    {
        using var legacy = fixture.CreateClient();
        legacy.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", fixture.LegacyKey);
        Assert.Equal(HttpStatusCode.OK, (await legacy.GetAsync("/uploads")).StatusCode);
        await using var db = fixture.CreateDbContext();
        var stored = await db.ApiKeys.SingleAsync(x => x.UserId == fixture.LegacyUserId);
        Assert.Equal(ApiKeySecrets.Hash(fixture.LegacyKey), stored.KeyHash);
        Assert.Equal(ApiKeySecrets.Mask(fixture.LegacyKey), stored.MaskedKey);

        var (owner, userId) = await fixture.CreateUserAsync();
        using var response = await owner.PostAsJsonAsync("/api-keys", new { name = "test" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var secret = json.GetProperty("key").GetString()!;
        var key = await db.ApiKeys.SingleAsync(x => x.UserId == userId);
        Assert.Equal(ApiKeySecrets.Hash(secret), key.KeyHash);
        Assert.DoesNotContain(secret, await owner.GetStringAsync("/api-keys"));
        using var api = fixture.CreateClient();
        api.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secret);
        Assert.Equal(HttpStatusCode.OK, (await api.GetAsync("/uploads")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.DeleteAsync($"/api-keys/{key.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await api.GetAsync("/uploads")).StatusCode);
    }

    [Fact]
    public async Task PreviewsAndHeadDoNotConsumeViewsAndDownloadsAreExplicit()
    {
        var (owner, _) = await fixture.CreateUserAsync();
        var path = await UploadAsync(owner, maxViews: 5);
        using var visitor = fixture.CreateClient();
        using var bot = fixture.CreateClient();
        bot.DefaultRequestHeaders.UserAgent.ParseAdd("Discordbot/2.0");
        var metadata = await bot.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, metadata.StatusCode);
        Assert.DoesNotContain("og:image\"", await metadata.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NotFound, (await bot.GetAsync(path + "?direct=true")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(path + "?preview=true")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await visitor.SendAsync(new HttpRequestMessage(HttpMethod.Head, path))).StatusCode);
        await using var db = fixture.CreateDbContext();
        var code = path.Split('/').Last();
        var initial = await db.Uploads.AsNoTracking().SingleAsync(x => x.ShortCode == code);
        Assert.Equal(0, initial.Views);
        Assert.Equal(0, initial.Downloads);

        visitor.DefaultRequestHeaders.Referrer = new Uri("http://attacker.test/dashboard");
        var view = await visitor.GetAsync(path + "?preview=true");
        Assert.Equal(HttpStatusCode.OK, view.StatusCode);
        Assert.True(view.Headers.CacheControl!.NoStore);
        Assert.Equal("nosniff", view.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Contains("sandbox", view.Headers.GetValues("Content-Security-Policy").Single());
        var download = await visitor.GetAsync(path + "?download=true");
        Assert.Equal("attachment", download.Content.Headers.ContentDisposition!.DispositionType);
        var updated = await db.Uploads.AsNoTracking().SingleAsync(x => x.ShortCode == code);
        Assert.Equal(2, updated.Views);
        Assert.Equal(1, updated.Downloads);
        Assert.Equal(2, await db.ViewLogs.CountAsync(x => x.UploadId == updated.Id));
        Assert.Equal(1, await db.DownloadLogs.CountAsync(x => x.UploadId == updated.Id));
    }

    [Fact]
    public async Task ConcurrentRequestsCannotExceedViewLimit()
    {
        var (owner, _) = await fixture.CreateUserAsync();
        var path = await UploadAsync(owner, maxViews: 1);
        using var visitor = fixture.CreateClient();
        var responses = await Task.WhenAll(Enumerable.Range(0, 12).Select(_ => visitor.GetAsync(path)));
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Equal(11, responses.Count(x => x.StatusCode == HttpStatusCode.NotFound));
        Assert.All(responses, x => Assert.True(x.Headers.CacheControl!.NoStore));
    }

    [Fact]
    public async Task ExpirationAppliesToFileAndOembedAndMetadataUsesCanonicalUrls()
    {
        var (owner, _) = await fixture.CreateUserAsync();
        var path = await UploadAsync(owner, mime: "image/gif");
        using var visitor = fixture.CreateClient();
        var embedUrl = "/api/oembed?url=" + Uri.EscapeDataString("http://attacker.test" + path + "?x=\"onerror=\"alert(1)");
        var before = await visitor.GetStringAsync(embedUrl);
        Assert.DoesNotContain("attacker.test", before);
        Assert.DoesNotContain("onerror", before);
        await using var db = fixture.CreateDbContext();
        var code = path.Split('/').Last();
        await db.Uploads.Where(x => x.ShortCode == code).ExecuteUpdateAsync(s => s.SetProperty(x => x.ExpiresAt, DateTimeOffset.UtcNow.AddSeconds(-1)));
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(embedUrl)).StatusCode);
    }

    [Fact]
    public async Task QuotasAreProtectedAndConcurrentUploadsRespectThem()
    {
        var (owner, userId) = await fixture.CreateUserAsync(maxUploads: 1, storageLimit: 10);
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.PutAsJsonAsync("/settings", new { maxUploads = 1000 })).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.PutAsJsonAsync("/settings", new { maxStorageLimit = 1000000 })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.PutAsJsonAsync("/settings", new { useCustomWords = false })).StatusCode);
        var results = await Task.WhenAll(Enumerable.Range(0, 5).Select(_ => PostUploadAsync(owner)));
        Assert.Single(results, x => x.StatusCode == HttpStatusCode.Created);
        Assert.Equal(4, results.Count(x => x.StatusCode == HttpStatusCode.TooManyRequests));
        await using var db = fixture.CreateDbContext();
        var settings = await db.UserSettings.AsNoTracking().SingleAsync(x => x.UserId == userId);
        Assert.Equal(10, settings.MaxStorageLimit);
        Assert.Equal(1, settings.MaxUploads);
        Assert.Equal(4, settings.StorageUsed);
        var upload = await db.Uploads.SingleAsync(x => x.UserId == userId);
        var deletions = await Task.WhenAll(Enumerable.Range(0, 4).Select(_ => owner.DeleteAsync($"/uploads/{upload.Id}?permanent=true")));
        Assert.Single(deletions, x => x.StatusCode == HttpStatusCode.OK);
        Assert.Equal(0, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.StorageUsed).SingleAsync());
    }

    [Fact]
    public async Task InvalidUploadOptionsAreRejectedWithoutStoringFiles()
    {
        var (owner, userId) = await fixture.CreateUserAsync();
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent([1, 2, 3]), "file", "test.bin");
        form.Add(new StringContent("999999999"), "expirationDays");
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsync("/uploads", form)).StatusCode);
        await using var db = fixture.CreateDbContext();
        Assert.False(await db.Uploads.AnyAsync(x => x.UserId == userId));
    }

    [Fact]
    public async Task FileFilteringAndPaginationStayWithinTheOwnersCollection()
    {
        var (owner, userId) = await fixture.CreateUserAsync();
        var (other, _) = await fixture.CreateUserAsync();
        await using var db = fixture.CreateDbContext();
        for (var i = 0; i < 73; i++)
        {
            db.Uploads.Add(new Upload
            {
                UserId = userId, OriginalName = $"file-{i:D3}", ShortCode = $"{userId}-{i}", Url = $"https://example.test/{userId}/{i}",
                DeletionKey = Guid.NewGuid().ToString("N"), MimeType = i % 2 == 0 ? "image/png" : "text/plain", Size = i
            });
        }
        await db.SaveChangesAsync();
        var first = await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?sort=size&direction=asc");
        Assert.Equal(73, first!.Total);
        Assert.Equal(50, first.Uploads.Count);
        var second = await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?sort=size&direction=asc&page=2");
        Assert.Equal(23, second!.Uploads.Count);
        Assert.Empty(first.Uploads.Select(x => x.Id).Intersect(second.Uploads.Select(x => x.Id)));
        var filtered = await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?search=FILE-07&kind=image");
        Assert.Equal(2, filtered!.FilteredTotal);
        Assert.Equal(73, filtered.Total);
        var otherFiles = await other.GetFromJsonAsync<ListUploadsResponse>("/uploads");
        Assert.Empty(otherFiles!.Uploads);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.GetAsync("/uploads?pageSize=999999")).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.GetAsync("/uploads?kind=invalid")).StatusCode);
    }

    [Fact]
    public async Task ConcurrentShortLinkClicksRespectLimitAndHeadDoesNotConsumeIt()
    {
        var (owner, _) = await fixture.CreateUserAsync();
        var created = await owner.PostAsJsonAsync("/short-links", new { url = "https://example.test/", maxClicks = 1 });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var body = await created.Content.ReadFromJsonAsync<JsonElement>();
        var path = new Uri(body.GetProperty("url").GetString()!).PathAndQuery;
        using var visitor = fixture.CreateClient(new() { AllowAutoRedirect = false });
        Assert.Equal(HttpStatusCode.Redirect, (await visitor.SendAsync(new HttpRequestMessage(HttpMethod.Head, path))).StatusCode);
        var responses = await Task.WhenAll(Enumerable.Range(0, 10).Select(_ => visitor.GetAsync(path)));
        Assert.Single(responses, x => x.StatusCode == HttpStatusCode.Redirect);
        Assert.Equal(9, responses.Count(x => x.StatusCode == HttpStatusCode.NotFound));
    }

    internal static async Task<string> UploadAsync(HttpClient client, int? maxViews = null, string mime = "text/plain", byte[]? bytes = null)
    {
        using var response = await PostUploadAsync(client, maxViews, mime, bytes);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<CreateUploadResponse>();
        return new Uri(result!.Url!).PathAndQuery;
    }

    private static async Task<HttpResponseMessage> PostUploadAsync(HttpClient client, int? maxViews = null, string mime = "text/plain", byte[]? bytes = null)
    {
        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes ?? Encoding.UTF8.GetBytes("test"));
        file.Headers.ContentType = new MediaTypeHeaderValue(mime);
        form.Add(file, "file", "test.bin");
        if (maxViews is not null) form.Add(new StringContent(maxViews.ToString()!), "maxViews");
        return await client.PostAsync("/uploads", form);
    }
}
