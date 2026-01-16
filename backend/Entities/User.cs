namespace TwinkForSale.Api.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string? Name { get; set; }
    public string Email { get; set; } = null!;
    public DateTime? EmailVerified { get; set; }
    public string? Image { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // User approval system
    public bool IsApproved { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedById { get; set; }
    public User? ApprovedBy { get; set; }
    public ICollection<User> ApprovedUsers { get; set; } = [];

    // OAuth accounts
    public ICollection<Account> Accounts { get; set; } = [];

    // App relations
    public ICollection<Upload> Uploads { get; set; } = [];
    public ICollection<ApiKey> ApiKeys { get; set; } = [];
    public ICollection<SystemEvent> SystemEvents { get; set; } = [];
    public ICollection<BioLink> BioLinks { get; set; } = [];
    public ICollection<BioView> BioViews { get; set; } = [];
    public ICollection<ShortLink> ShortLinks { get; set; } = [];

    // User settings
    public UserSettings? Settings { get; set; }
}
