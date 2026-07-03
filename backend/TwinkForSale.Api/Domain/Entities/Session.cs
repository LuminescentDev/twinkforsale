namespace TwinkForSale.Api.Domain.Entities;

public sealed class Session
{
    public string Id { get; set; } = EntityIds.NewId();
    public string SessionToken { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTimeOffset Expires { get; set; }

    public User? User { get; set; }
}
