namespace TwinkForSale.Api.Infrastructure.Storage;

public interface IFileStorage
{
    Task<FileUploadResult> UploadAsync(IFormFile file, string key, string? userId, CancellationToken cancellationToken);

    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken);

    Task<bool> DeleteAsync(string key, CancellationToken cancellationToken);
}
