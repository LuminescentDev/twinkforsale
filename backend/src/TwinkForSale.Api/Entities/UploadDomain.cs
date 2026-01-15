namespace TwinkForSale.Api.Entities;

public class UploadDomain
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Domain { get; set; } = null!;
    public string Name { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public bool IsDefault { get; set; }
    public bool SupportsSubdomains { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Relations
    public ICollection<UserSettings> UserSettings { get; set; } = [];
}
