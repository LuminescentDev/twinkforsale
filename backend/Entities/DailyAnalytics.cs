namespace TwinkForSale.Api.Entities;

public class DailyAnalytics
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public DateTime Date { get; set; }
    public int TotalViews { get; set; }
    public int UniqueViews { get; set; }
    public int TotalDownloads { get; set; }
    public int UniqueDownloads { get; set; }
    public int UploadsCount { get; set; }
    public int UsersRegistered { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
