namespace TwinkForSale.Api.Services.Storage;

public interface IStorageService
{
    Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
    Task<Stream?> GetAsync(string path, CancellationToken ct = default);
    Task<bool> DeleteAsync(string path, CancellationToken ct = default);
    Task<bool> ExistsAsync(string path, CancellationToken ct = default);
    string GetPublicUrl(string path);
}
