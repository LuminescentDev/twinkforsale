namespace TwinkForSale.Api.Domain.Entities;

public sealed class UploadDomain
{
    public string Id { get; set; } = EntityIds.NewId();
    public string Domain { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public bool SupportsSubdomains { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<UserSettings> UserSettings { get; set; } = [];
}
