namespace TwinkForSale.Api.Infrastructure.Configuration;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string Provider { get; init; } = "Local";

    public string LocalPath { get; init; } = "uploads";

    public R2StorageOptions R2 { get; init; } = new();
}

public sealed class R2StorageOptions
{
    public string AccountId { get; init; } = string.Empty;

    public string AccessKeyId { get; init; } = string.Empty;

    public string SecretAccessKey { get; init; } = string.Empty;

    public string BucketName { get; init; } = string.Empty;

    public string PublicUrl { get; init; } = string.Empty;
}
