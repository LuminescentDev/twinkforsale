namespace TwinkForSale.Api.Domain.Entities;

public sealed class User
{
    public string Id { get; set; } = EntityIds.NewId();
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTimeOffset? EmailVerified { get; set; }
    public string? Image { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsApproved { get; set; }
    public bool IsAdmin { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public string? ApprovedById { get; set; }

    public User? ApprovedBy { get; set; }
    public ICollection<User> ApprovedUsers { get; set; } = [];
    public ICollection<Account> Accounts { get; set; } = [];
    public ICollection<Session> Sessions { get; set; } = [];
    public ICollection<Upload> Uploads { get; set; } = [];
    public ICollection<ApiKey> ApiKeys { get; set; } = [];
    public ICollection<SystemEvent> SystemEvents { get; set; } = [];
    public ICollection<BioLink> BioLinks { get; set; } = [];
    public ICollection<BioView> BioViewLogs { get; set; } = [];
    public ICollection<ShortLink> ShortLinks { get; set; } = [];
    public UserSettings? Settings { get; set; }
}
