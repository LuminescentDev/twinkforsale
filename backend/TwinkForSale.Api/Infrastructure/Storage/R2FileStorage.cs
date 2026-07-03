using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using TwinkForSale.Api.Infrastructure.Configuration;

namespace TwinkForSale.Api.Infrastructure.Storage;

public sealed class R2FileStorage(IOptions<StorageOptions> options) : IFileStorage
{
    public async Task<FileUploadResult> UploadAsync(IFormFile file, string key, string? userId, CancellationToken cancellationToken)
    {
        var r2 = options.Value.R2;
        if (string.IsNullOrWhiteSpace(r2.AccountId) ||
            string.IsNullOrWhiteSpace(r2.AccessKeyId) ||
            string.IsNullOrWhiteSpace(r2.SecretAccessKey) ||
            string.IsNullOrWhiteSpace(r2.BucketName))
        {
            return FileUploadResult.Failed("R2 storage is not configured.");
        }

        try
        {
            var objectKey = BuildObjectKey(key, userId);
            using var client = CreateClient(r2);
            await using var stream = file.OpenReadStream();
            await using var buffer = new MemoryStream();
            await stream.CopyToAsync(buffer, cancellationToken);
            buffer.Position = 0;

            await client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = r2.BucketName,
                Key = objectKey,
                InputStream = buffer,
                ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                AutoCloseStream = false,
                AutoResetStreamPosition = false,
                UseChunkEncoding = false,
                DisablePayloadSigning = true,
                Headers =
                {
                    ContentLength = buffer.Length
                }
            }, cancellationToken);

            var publicUrl = string.IsNullOrWhiteSpace(r2.PublicUrl)
                ? null
                : $"{r2.PublicUrl.TrimEnd('/')}/{objectKey}";

            return FileUploadResult.Succeeded(objectKey, publicUrl);
        }
        catch (AmazonS3Exception ex)
        {
            return FileUploadResult.Failed($"R2 upload failed: {ex.Message}");
        }
        catch (Exception ex)
        {
            return FileUploadResult.Failed($"Storage upload failed: {ex.Message}");
        }
    }

    public async Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken)
    {
        var r2 = options.Value.R2;
        using var client = CreateClient(r2);
        try
        {
            var response = await client.GetObjectAsync(r2.BucketName, key, cancellationToken);
            var memory = new MemoryStream();
            await response.ResponseStream.CopyToAsync(memory, cancellationToken);
            memory.Position = 0;
            return memory;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<bool> DeleteAsync(string key, CancellationToken cancellationToken)
    {
        var r2 = options.Value.R2;
        using var client = CreateClient(r2);
        await client.DeleteObjectAsync(r2.BucketName, key, cancellationToken);
        return true;
    }

    private static string BuildObjectKey(string key, string? userId)
    {
        var userSegment = string.IsNullOrWhiteSpace(userId) ? "anonymous" : userId;
        return $"{userSegment}/{key}".Replace('\\', '/');
    }

    private static AmazonS3Client CreateClient(R2StorageOptions options)
    {
        var credentials = new BasicAWSCredentials(options.AccessKeyId, options.SecretAccessKey);
        return new AmazonS3Client(credentials, new AmazonS3Config
        {
            ServiceURL = $"https://{options.AccountId}.r2.cloudflarestorage.com",
            ForcePathStyle = true
        });
    }
}
