namespace TwinkForSale.Api.Services.Storage;

public class LocalStorageService : IStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;
    private readonly ILogger<LocalStorageService> _logger;

    public LocalStorageService(IConfiguration config, ILogger<LocalStorageService> logger)
    {
        _basePath = config["Storage:LocalPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        _baseUrl = config["Storage:BaseUrl"] ?? "/files";
        _logger = logger;

        if (!Directory.Exists(_basePath))
        {
            Directory.CreateDirectory(_basePath);
        }
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        // Generate unique path: year/month/filename
        var now = DateTime.UtcNow;
        var relativePath = Path.Combine(now.Year.ToString(), now.Month.ToString("D2"), fileName);
        var fullPath = Path.Combine(_basePath, relativePath);

        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }

        await using var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write);
        await stream.CopyToAsync(fileStream, ct);

        _logger.LogInformation("File saved to {Path}", relativePath);
        return relativePath.Replace('\\', '/');
    }

    public async Task<Stream?> GetAsync(string path, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(fullPath))
        {
            return null;
        }

        return new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
    }

    public Task<bool> DeleteAsync(string path, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(fullPath))
        {
            return Task.FromResult(false);
        }

        File.Delete(fullPath);
        _logger.LogInformation("File deleted: {Path}", path);
        return Task.FromResult(true);
    }

    public Task<bool> ExistsAsync(string path, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_basePath, path.Replace('/', Path.DirectorySeparatorChar));
        return Task.FromResult(File.Exists(fullPath));
    }

    public string GetPublicUrl(string path)
    {
        return $"{_baseUrl}/{path}";
    }
}
