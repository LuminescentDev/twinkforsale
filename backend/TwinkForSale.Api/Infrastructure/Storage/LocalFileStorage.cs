using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Configuration;

namespace TwinkForSale.Api.Infrastructure.Storage;

public sealed class LocalFileStorage(IOptions<StorageOptions> options, IWebHostEnvironment environment) : IFileStorage
{
    public async Task<FileUploadResult> UploadAsync(IFormFile file, string key, string? userId, CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            return FileUploadResult.Failed("Cannot upload an empty file.");
        }

        var root = GetRootPath();
        var safeUserSegment = string.IsNullOrWhiteSpace(userId) ? "anonymous" : SanitizePathSegment(userId);
        var relativeKey = Path.Combine(safeUserSegment, SanitizePathSegment(key));
        var destinationPath = Path.Combine(root, relativeKey);

        Directory.CreateDirectory(Path.GetDirectoryName(destinationPath)!);

        await using var destination = File.Create(destinationPath);
        await file.CopyToAsync(destination, cancellationToken);

        return FileUploadResult.Succeeded(relativeKey.Replace(Path.DirectorySeparatorChar, '/'));
    }

    public Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        var path = Path.Combine(GetRootPath(), key.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(path))
        {
            return Task.FromResult<Stream?>(null);
        }

        return Task.FromResult<Stream?>(File.OpenRead(path));
    }

    public Task<bool> DeleteAsync(string key, CancellationToken cancellationToken)
    {
        var path = Path.Combine(GetRootPath(), key.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(path))
        {
            return Task.FromResult(false);
        }

        File.Delete(path);
        return Task.FromResult(true);
    }

    private string GetRootPath()
    {
        var configuredPath = options.Value.LocalPath;
        return Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath);
    }

    private static string SanitizePathSegment(string value)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        return string.Concat(value.Select(ch => invalidChars.Contains(ch) ? '_' : ch));
    }
}
