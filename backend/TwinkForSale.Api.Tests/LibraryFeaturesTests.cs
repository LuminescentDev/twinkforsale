using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Features.Bio.Get;
using TwinkForSale.Api.Features.Uploads.Get;
using TwinkForSale.Api.Features.Uploads.Post;
using TwinkForSale.Api.Infrastructure.Auth;
using Xunit;

namespace TwinkForSale.Api.Tests;

public sealed class LibraryFeaturesTests(ApiFixture fixture) : IClassFixture<ApiFixture>
{
    [Fact]
    public async Task ExistingUploadsRemainPublicAfterMigration()
    {
        await using var db = fixture.CreateDbContext();
        var legacy = await db.Uploads.SingleAsync(x => x.Id == fixture.LegacyUploadId);
        Assert.Equal("public", legacy.AccessMode);
        Assert.Empty(legacy.Tags);
        Assert.Null(legacy.DeletedAt);
        Assert.False(legacy.IsPending);
    }

    [Fact]
    public async Task MalformedCollectionBodiesAreRejected()
    {
        var (owner, _) = await fixture.CreateUserAsync();
        foreach (var path in new[] { "/albums", "/file-requests", "/upload-presets", "/saved-filters" })
            Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsync(path, new StringContent("{", Encoding.UTF8, "application/json"))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync("/saved-filters", new { name = "bad", search = (string?)null })).StatusCode);
    }

    [Fact]
    public async Task PasswordAttemptsAreLimitedPerFileEvenWithDifferentForwardedAddresses()
    {
        var (owner, _) = await fixture.CreateUserAsync(); var file = await Upload(owner);
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file, "password", "fixture-password"))).EnsureSuccessStatusCode();
        using var visitor = fixture.CreateClient();
        for (var i = 0; i < 11; i++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, PathFor(file) + "/unlock")
            { Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["password"] = "wrong-password" }) };
            request.Headers.Add("X-Forwarded-For", $"192.0.2.{i + 1}");
            var response = await visitor.SendAsync(request);
            Assert.Equal(i < 10 ? HttpStatusCode.Forbidden : HttpStatusCode.TooManyRequests, response.StatusCode);
        }
    }

    private static MultipartFormDataContent FileForm(string name = "sample.txt")
    {
        var form = new MultipartFormDataContent();
        var content = new ByteArrayContent(Encoding.UTF8.GetBytes("test"));
        content.Headers.ContentType = new("text/plain"); form.Add(content, "file", name); return form;
    }
    private static async Task<UploadListItem> Upload(HttpClient owner, string name = "sample.txt", string? preset = null)
    {
        using var form = FileForm(name); if (preset is not null) form.Add(new StringContent(preset), "presetId");
        var result = await owner.PostAsync("/uploads", form); result.EnsureSuccessStatusCode();
        var created = (await result.Content.ReadFromJsonAsync<CreateUploadResponse>())!;
        return (await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads"))!.Uploads.Single(x => x.Url == created.Url);
    }
    private static object Settings(UploadListItem file, string mode = "public", string? password = null, bool revoked = false) =>
        new { displayName = "Renamed screenshot", tags = new[] { "Game", "event" }, isFavorite = true, isRevoked = revoked,
            expiresAt = file.ExpiresAt, maxViews = file.MaxViews, accessMode = mode, password };
    private static string PathFor(UploadListItem file) => new Uri(file.Url).PathAndQuery;
    private static async Task<string> Album(HttpClient owner, string[] ids, string title = "Gallery")
    {
        var response = await owner.PostAsJsonAsync("/albums", new { title, uploadIds = ids, showOnBio = true });
        response.EnsureSuccessStatusCode(); return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetString()!;
    }

    [Fact]
    public async Task FileSettingsAreOwnedAndFiltersPersist()
    {
        var (owner, _) = await fixture.CreateUserAsync(); var (other, _) = await fixture.CreateUserAsync();
        var file = await Upload(owner);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file))).StatusCode);
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file))).EnsureSuccessStatusCode();
        var filtered = (await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?favoritesOnly=true&tag=game&period=month&search=Renamed"))!;
        Assert.Single(filtered.Uploads); Assert.Equal("Renamed screenshot", filtered.Uploads[0].OriginalName);
        Assert.Empty((await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?tag=missing"))!.Uploads);
        (await owner.PostAsJsonAsync("/saved-filters", new { name = "This month's screenshots", favoritesOnly = true, period = "month", kind = "image" })).EnsureSuccessStatusCode();
        var saved = await owner.GetFromJsonAsync<JsonElement>("/saved-filters");
        var id = saved.GetProperty("filters")[0].GetProperty("id").GetString();
        Assert.Empty((await other.GetFromJsonAsync<JsonElement>("/saved-filters")).GetProperty("filters").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await other.DeleteAsync($"/saved-filters/{id}")).StatusCode);
        (await owner.DeleteAsync($"/saved-filters/{id}")).EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task PasswordsMembersAndRevocationProtectAllFileVariants()
    {
        var (owner, _) = await fixture.CreateUserAsync(); var (member, _) = await fixture.CreateUserAsync();
        var file = await Upload(owner); var path = PathFor(file);
        using var visitor = fixture.CreateClient(new() { AllowAutoRedirect = false });
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file, "password", "long-test-password"))).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, (await visitor.GetAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await visitor.GetAsync(path + "?direct=true")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync("/oembed?url=" + Uri.EscapeDataString(file.Url))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await visitor.PostAsync(path + "/unlock", new FormUrlEncodedContent(new Dictionary<string, string> { ["password"] = "incorrect-password" }))).StatusCode);
        var grant = await visitor.PostAsync(path + "/unlock", new FormUrlEncodedContent(new Dictionary<string, string> { ["password"] = "long-test-password" }));
        Assert.Equal(HttpStatusCode.Redirect, grant.StatusCode);
        Assert.Equal("test", await visitor.GetStringAsync(path + "?download=true"));
        await using var db = fixture.CreateDbContext();
        var stored = await db.Uploads.AsNoTracking().SingleAsync(x => x.Id == file.Id);
        Assert.NotEqual("long-test-password", stored.PasswordHash); Assert.DoesNotContain("long-test-password", await owner.GetStringAsync($"/uploads/{file.Id}"));
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file, "password", "replacement-password"))).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, (await visitor.GetAsync(path)).StatusCode);
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file, "members"))).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Forbidden, (await visitor.GetAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await member.GetAsync(path)).StatusCode);
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file, revoked: true))).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NotFound, (await member.GetAsync(path)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(path + "?preview=true")).StatusCode);
        (await owner.PutAsJsonAsync($"/uploads/{file.Id}", Settings(file))).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, (await visitor.GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task TrashRestoresAndOnlyPermanentDeletionReleasesQuota()
    {
        var (owner, userId) = await fixture.CreateUserAsync(storageLimit: 4); var file = await Upload(owner);
        (await owner.DeleteAsync($"/uploads/{file.Id}")).EnsureSuccessStatusCode();
        Assert.Empty((await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads"))!.Uploads);
        Assert.Single((await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?state=trash"))!.Uploads);
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync(PathFor(file))).StatusCode);
        using var form = FileForm(); Assert.Equal(HttpStatusCode.RequestEntityTooLarge, (await owner.PostAsync("/uploads", form)).StatusCode);
        (await owner.PostAsync($"/uploads/{file.Id}/restore", null)).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(PathFor(file))).StatusCode);
        (await owner.DeleteAsync($"/uploads/{file.Id}")).EnsureSuccessStatusCode();
        await using var db = fixture.CreateDbContext();
        await db.Uploads.Where(x => x.Id == file.Id).ExecuteUpdateAsync(s => s.SetProperty(x => x.DeletedAt, DateTimeOffset.UtcNow.AddDays(-31)));
        Assert.Equal(HttpStatusCode.NotFound, (await owner.PostAsync($"/uploads/{file.Id}/restore", null)).StatusCode);
        (await owner.DeleteAsync($"/uploads/{file.Id}?permanent=true")).EnsureSuccessStatusCode();
        Assert.Equal(0, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.StorageUsed).SingleAsync());
        Assert.False(await db.Uploads.AnyAsync(x => x.Id == file.Id));
    }

    [Fact]
    public async Task AlbumsEnforceOwnershipOrderingExpirationAndFileVisibility()
    {
        var (owner, _) = await fixture.CreateUserAsync(); var (other, _) = await fixture.CreateUserAsync();
        var first = await Upload(owner, "first.txt"); var second = await Upload(owner, "second.txt"); var foreign = await Upload(other);
        Assert.Equal(HttpStatusCode.BadRequest, (await owner.PostAsJsonAsync("/albums", new { title = "Wrong owner", uploadIds = new[] { foreign.Id } })).StatusCode);
        var id = await Album(owner, [second.Id, first.Id]);
        var albums = await owner.GetFromJsonAsync<JsonElement>("/albums"); var code = albums.GetProperty("albums")[0].GetProperty("code").GetString();
        using var visitor = fixture.CreateClient(); var publicPath = $"/public/albums/{code}";
        var items = (await visitor.GetFromJsonAsync<JsonElement>(publicPath)).GetProperty("items"); Assert.Equal(second.Id, items[0].GetProperty("id").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync($"/albums/{id}", new { title = "Hijack", uploadIds = Array.Empty<string>() })).StatusCode);
        (await owner.PutAsJsonAsync($"/uploads/{second.Id}", Settings(second, "members"))).EnsureSuccessStatusCode();
        Assert.Single((await visitor.GetFromJsonAsync<JsonElement>(publicPath)).GetProperty("items").EnumerateArray());
        Assert.Equal(2, (await owner.GetFromJsonAsync<JsonElement>(publicPath)).GetProperty("items").GetArrayLength());
        (await owner.PutAsJsonAsync($"/albums/{id}", new { title = "Expired", uploadIds = new[] { first.Id }, expiresAt = DateTimeOffset.UtcNow.AddMinutes(-1) })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(publicPath)).StatusCode);
    }

    [Fact]
    public async Task AnonymousRequestsAreBoundedPrivateAndRequireOwnerApproval()
    {
        var (owner, userId) = await fixture.CreateUserAsync(); var (other, _) = await fixture.CreateUserAsync();
        var albumId = await Album(owner, []);
        var response = await owner.PostAsJsonAsync("/file-requests", new { albumId, title = "Send photos", expiresAt = DateTimeOffset.UtcNow.AddDays(1), maxFiles = 2, maxFileSize = 10 });
        response.EnsureSuccessStatusCode(); var code = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("code").GetString();
        using var visitor = fixture.CreateClient(); var path = $"/public/file-requests/{code}";
        var submissions = await Task.WhenAll(Enumerable.Range(0, 6).Select(async i => { using var form = FileForm($"request-{i}.txt"); return await visitor.PostAsync(path, form); }));
        Assert.Equal(2, submissions.Count(x => x.StatusCode == HttpStatusCode.Created));
        Assert.All(submissions.Where(x => x.StatusCode != HttpStatusCode.Created), x => Assert.Equal(HttpStatusCode.NotFound, x.StatusCode));
        Assert.DoesNotContain("/f/", await submissions.First(x => x.IsSuccessStatusCode).Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(path)).StatusCode);
        var pending = (await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads?state=pending"))!.Uploads;
        Assert.Equal(2, pending.Count); Assert.Empty((await owner.GetFromJsonAsync<ListUploadsResponse>("/uploads"))!.Uploads);
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync(PathFor(pending[0]))).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync(PathFor(pending[0]) + "?preview=true")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsync($"/uploads/{pending[0].Id}/approve", null)).StatusCode);
        (await owner.PostAsync($"/uploads/{pending[0].Id}/approve", null)).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, (await visitor.GetAsync(PathFor(pending[0]))).StatusCode);
        (await owner.DeleteAsync($"/uploads/{pending[1].Id}")).EnsureSuccessStatusCode();
        await using var db = fixture.CreateDbContext();
        Assert.Equal(8, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.StorageUsed).SingleAsync());
        Assert.Single(await db.AlbumUploads.Where(x => x.AlbumId == albumId).ToListAsync());
        (await owner.DeleteAsync($"/albums/{albumId}")).EnsureSuccessStatusCode();
        (await owner.PostAsync($"/uploads/{pending[1].Id}/restore", null)).EnsureSuccessStatusCode();
        (await owner.PostAsync($"/uploads/{pending[1].Id}/approve", null)).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, (await visitor.GetAsync(PathFor(pending[1]))).StatusCode);
    }

    [Fact]
    public async Task PresetsApplyLimitsAndEmbedSnapshotsWithoutChangingAccountDefaults()
    {
        var (owner, userId) = await fixture.CreateUserAsync(); var (other, _) = await fixture.CreateUserAsync();
        (await owner.PostAsJsonAsync("/upload-presets", new { name = "Screenshots", expirationDays = 2, maxViews = 10, embedTitle = "Screenshot preset", embedColor = "#123456" })).EnsureSuccessStatusCode();
        var presets = await owner.GetFromJsonAsync<JsonElement>("/upload-presets");
        var id = presets.GetProperty("presets")[0].GetProperty("id").GetString()!;
        using var foreign = FileForm(); foreign.Add(new StringContent(id), "presetId"); Assert.Equal(HttpStatusCode.BadRequest, (await other.PostAsync("/uploads", foreign)).StatusCode);
        var upload = await Upload(owner, preset: id);
        Assert.Equal(10, upload.MaxViews); Assert.True(upload.ExpiresAt > DateTimeOffset.UtcNow.AddDays(1));
        await using var db = fixture.CreateDbContext();
        Assert.Equal("Screenshot preset", await db.Uploads.Where(x => x.Id == upload.Id).Select(x => x.EmbedTitle).SingleAsync());
        Assert.Equal(new TwinkForSale.Api.Domain.Entities.UserSettings().EmbedTitle, await db.UserSettings.Where(x => x.UserId == userId).Select(x => x.EmbedTitle).SingleAsync());
        (await owner.DeleteAsync($"/upload-presets/{id}")).EnsureSuccessStatusCode();
        Assert.Equal("Screenshot preset", (await owner.GetFromJsonAsync<JsonElement>("/oembed?url=" + Uri.EscapeDataString(upload.Url))).GetProperty("title").GetString());
    }

    [Fact]
    public async Task BioDraftLinksAndRestoredRevisionsDoNotLeakBeforePublishing()
    {
        var (owner, _) = await fixture.CreateUserAsync(); var (other, _) = await fixture.CreateUserAsync();
        var username = "bio-" + Guid.NewGuid().ToString("N")[..12]; using var visitor = fixture.CreateClient();
        (await owner.PutAsJsonAsync("/bio/me", new { username, displayName = "First version", isPublic = true })).EnsureSuccessStatusCode();
        (await owner.PostAsJsonAsync("/bio/links", new { title = "First link", url = "https://example.com/first" })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NotFound, (await visitor.GetAsync($"/public/bio/{username}")).StatusCode);
        (await owner.PostAsync("/bio/draft/publish", null)).EnsureSuccessStatusCode();
        var published = (await visitor.GetFromJsonAsync<BioResponse>($"/public/bio/{username}"))!; Assert.Equal("First version", published.DisplayName); Assert.Single(published.Links);
        (await owner.PutAsJsonAsync("/bio/me", new { username, displayName = "Second version", isPublic = true })).EnsureSuccessStatusCode();
        (await owner.DeleteAsync($"/bio/links/{published.Links[0].Id}")).EnsureSuccessStatusCode();
        Assert.Single((await visitor.GetFromJsonAsync<BioResponse>($"/public/bio/{username}"))!.Links);
        (await owner.PostAsync("/bio/draft/publish", null)).EnsureSuccessStatusCode();
        var history = await owner.GetFromJsonAsync<JsonElement>("/bio/revisions"); var revision = history.GetProperty("revisions")[0].GetProperty("id").GetString();
        Assert.Equal(HttpStatusCode.NotFound, (await other.PostAsync($"/bio/revisions/{revision}/restore", null)).StatusCode);
        (await owner.PostAsync($"/bio/revisions/{revision}/restore", null)).EnsureSuccessStatusCode();
        Assert.Equal("First version", (await owner.GetFromJsonAsync<BioResponse>("/bio/me"))!.DisplayName);
        Assert.Equal("Second version", (await visitor.GetFromJsonAsync<BioResponse>($"/public/bio/{username}"))!.DisplayName);
        (await owner.PostAsync("/bio/draft/publish", null)).EnsureSuccessStatusCode();
        Assert.Single((await visitor.GetFromJsonAsync<BioResponse>($"/public/bio/{username}"))!.Links);
    }

    [Fact]
    public async Task ShortLinkDestinationsCanChangePauseAndRestoreFromHistory()
    {
        var (owner, _) = await fixture.CreateUserAsync(); var (other, _) = await fixture.CreateUserAsync();
        (await owner.PostAsJsonAsync("/short-links", new { url = "https://example.com/one" })).EnsureSuccessStatusCode();
        var item = (await owner.GetFromJsonAsync<JsonElement>("/short-links")).GetProperty("links")[0]; var id = item.GetProperty("id").GetString(); var code = item.GetProperty("code").GetString();
        Assert.Equal(HttpStatusCode.NotFound, (await other.PutAsJsonAsync($"/short-links/{id}", new { url = "https://example.com/other" })).StatusCode);
        (await owner.PutAsJsonAsync($"/short-links/{id}", new { url = "https://example.com/two", isPaused = true })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NotFound, (await owner.GetAsync($"/l/{code}")).StatusCode);
        (await owner.PutAsJsonAsync($"/short-links/{id}", new { url = "https://example.com/two", isPaused = false })).EnsureSuccessStatusCode();
        Assert.Equal("https://example.com/two", (await owner.GetAsync($"/l/{code}")).Headers.Location!.ToString());
        var history = (await owner.GetFromJsonAsync<JsonElement>($"/short-links/{id}/history")).GetProperty("history");
        Assert.Single(history.EnumerateArray()); Assert.Equal("https://example.com/one", history[0].GetProperty("url").GetString());
        Assert.Equal(HttpStatusCode.NotFound, (await other.GetAsync($"/short-links/{id}/history")).StatusCode);
    }
}
