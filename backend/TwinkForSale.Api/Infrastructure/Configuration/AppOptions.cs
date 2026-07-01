namespace TwinkForSale.Api.Infrastructure.Configuration;

public sealed class AppOptions
{
    public const string SectionName = "App";

    public string BaseUrl { get; init; } = "https://twink.forsale";

    public string FrontendUrl { get; init; } = "http://localhost:5173";

    public long BaseStorageLimit { get; init; } = 10_737_418_240;
}
