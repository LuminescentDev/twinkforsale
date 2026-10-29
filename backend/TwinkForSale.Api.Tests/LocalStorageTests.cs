using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Storage;
using Xunit;

namespace TwinkForSale.Api.Tests;

public sealed class LocalStorageTests : IDisposable
{
    private readonly string root = Path.Combine(Path.GetTempPath(), $"tfs-storage-tests-{Guid.NewGuid():N}");

    private LocalFileStorage CreateStorage() => new(Options.Create(new StorageOptions { LocalPath = root }), new TestEnvironment(root));

    [Fact]
    public async Task LegacyKeysUseTheSamePathForReadingAndDeletion()
    {
        var path = Path.Combine(root, "user", "legacy.txt");
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await File.WriteAllTextAsync(path, "legacy");
        var storage = CreateStorage();
        await using (var stream = await storage.OpenReadAsync("users/user/legacy.txt", default))
        {
            Assert.NotNull(stream);
        }
        Assert.True(await storage.DeleteAsync("users/user/legacy.txt", default));
        Assert.False(File.Exists(path));
    }

    [Fact]
    public async Task TraversalIsRejectedForReadAndDelete()
    {
        var storage = CreateStorage();
        await Assert.ThrowsAsync<InvalidDataException>(() => storage.OpenReadAsync("../outside", default));
        await Assert.ThrowsAsync<InvalidDataException>(() => storage.DeleteAsync("../outside", default));
    }

    [Fact]
    public async Task ANameCollisionDoesNotOverwriteOrDeleteExistingData()
    {
        var storage = CreateStorage();
        using var stream = new MemoryStream([1, 2, 3]);
        var file = new FormFile(stream, 0, stream.Length, "file", "test.bin");
        var first = await storage.UploadAsync(file, "key", "user", default);
        Assert.True(first.Success);
        await Assert.ThrowsAsync<IOException>(() => storage.UploadAsync(file, "key", "user", default));
        Assert.Equal(new byte[] { 1, 2, 3 }, await File.ReadAllBytesAsync(Path.Combine(root, "user", "key")));
    }

    [Fact]
    public async Task CancelledUploadsDoNotLeavePartialFiles()
    {
        var storage = CreateStorage();
        using var stream = new MemoryStream([1, 2, 3]);
        var file = new FormFile(stream, 0, stream.Length, "file", "test.bin");
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => storage.UploadAsync(file, "cancelled", "user", new CancellationToken(true)));
        Assert.False(File.Exists(Path.Combine(root, "user", "cancelled")));
    }

    public void Dispose()
    {
        if (Directory.Exists(root)) Directory.Delete(root, recursive: true);
    }

    private sealed class TestEnvironment(string root) : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "tests";
        public string EnvironmentName { get; set; } = "Testing";
        public string ContentRootPath { get; set; } = root;
        public string WebRootPath { get; set; } = root;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    }
}
