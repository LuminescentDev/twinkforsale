using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Jpeg;

namespace TwinkForSale.Api.Services.Image;

public class ImageSharpService : IImageService
{
    private static readonly HashSet<string> SupportedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp"
    };

    private readonly ILogger<ImageSharpService> _logger;

    public ImageSharpService(ILogger<ImageSharpService> logger)
    {
        _logger = logger;
    }

    public bool IsImage(string contentType)
    {
        return SupportedContentTypes.Contains(contentType);
    }

    public async Task<ImageDimensions?> GetDimensionsAsync(Stream stream, CancellationToken ct = default)
    {
        try
        {
            var position = stream.Position;
            var info = await SixLabors.ImageSharp.Image.IdentifyAsync(stream, ct);
            stream.Position = position;

            if (info == null)
            {
                return null;
            }

            return new ImageDimensions(info.Width, info.Height);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to identify image dimensions");
            return null;
        }
    }

    public async Task<Stream> GenerateThumbnailAsync(Stream stream, int maxWidth, int maxHeight, CancellationToken ct = default)
    {
        var position = stream.Position;

        using var image = await SixLabors.ImageSharp.Image.LoadAsync(stream, ct);
        stream.Position = position;

        image.Mutate(x => x.Resize(new ResizeOptions
        {
            Size = new Size(maxWidth, maxHeight),
            Mode = ResizeMode.Max
        }));

        var outputStream = new MemoryStream();
        await image.SaveAsync(outputStream, new JpegEncoder { Quality = 80 }, ct);
        outputStream.Position = 0;

        return outputStream;
    }
}
