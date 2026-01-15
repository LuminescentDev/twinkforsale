using Amazon.S3;
using Amazon.S3.Model;

namespace TwinkForSale.Api.Services.Storage;

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _baseUrl;
    private readonly ILogger<S3StorageService> _logger;

    public S3StorageService(IConfiguration config, ILogger<S3StorageService> logger)
    {
        _bucketName = config["Storage:S3:BucketName"] ?? throw new InvalidOperationException("S3 bucket name not configured");
        _baseUrl = config["Storage:S3:BaseUrl"] ?? throw new InvalidOperationException("S3 base URL not configured");
        _logger = logger;

        var s3Config = new AmazonS3Config
        {
            ServiceURL = config["Storage:S3:Endpoint"],
            ForcePathStyle = true
        };

        _s3Client = new AmazonS3Client(
            config["Storage:S3:AccessKey"],
            config["Storage:S3:SecretKey"],
            s3Config);
    }

    public async Task<string> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var key = $"{now.Year}/{now.Month:D2}/{fileName}";

        var request = new PutObjectRequest
        {
            BucketName = _bucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            DisablePayloadSigning = true
        };

        await _s3Client.PutObjectAsync(request, ct);
        _logger.LogInformation("File uploaded to S3: {Key}", key);
        return key;
    }

    public async Task<Stream?> GetAsync(string path, CancellationToken ct = default)
    {
        try
        {
            var response = await _s3Client.GetObjectAsync(_bucketName, path, ct);
            return response.ResponseStream;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<bool> DeleteAsync(string path, CancellationToken ct = default)
    {
        try
        {
            await _s3Client.DeleteObjectAsync(_bucketName, path, ct);
            _logger.LogInformation("File deleted from S3: {Path}", path);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<bool> ExistsAsync(string path, CancellationToken ct = default)
    {
        try
        {
            await _s3Client.GetObjectMetadataAsync(_bucketName, path, ct);
            return true;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public string GetPublicUrl(string path)
    {
        return $"{_baseUrl}/{path}";
    }
}
