namespace TwinkForSale.Api.Infrastructure.Storage;

public sealed record FileUploadResult(
    bool Success,
    string? Key,
    string? PublicUrl,
    string? Error)
{
    public static FileUploadResult Failed(string error) => new(false, null, null, error);

    public static FileUploadResult Succeeded(string key, string? publicUrl = null) => new(true, key, publicUrl, null);
}
