namespace TwinkForSale.Api.Domain.Entities;

public sealed class DailyAnalytics
{
    public string Id { get; set; } = EntityIds.NewId();
    public DateTimeOffset Date { get; set; }
    public int TotalViews { get; set; }
    public int UniqueViews { get; set; }
    public int TotalDownloads { get; set; }
    public int UniqueDownloads { get; set; }
    public int UploadsCount { get; set; }
    public int UsersRegistered { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
