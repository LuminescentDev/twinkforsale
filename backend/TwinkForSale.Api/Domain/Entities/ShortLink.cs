namespace TwinkForSale.Api.Domain.Entities;

public sealed class ShortLink
{
    public string Id { get; set; } = EntityIds.NewId();
    public string Code { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ExpiresAt { get; set; }
    public int? MaxClicks { get; set; }
    public int Clicks { get; set; }
    public DateTimeOffset? LastClicked { get; set; }
    public string? UserId { get; set; }

    public User? User { get; set; }
}
