namespace TwinkForSale.Api.Services.Image;

public record ImageDimensions(int Width, int Height);

public interface IImageService
{
    bool IsImage(string contentType);
    Task<ImageDimensions?> GetDimensionsAsync(Stream stream, CancellationToken ct = default);
    Task<Stream> GenerateThumbnailAsync(Stream stream, int maxWidth, int maxHeight, CancellationToken ct = default);
}
