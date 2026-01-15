using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using FastEndpoints;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.ApiKeys;

public class CreateApiKeyRequest
{
    public string Name { get; set; } = null!;
    public DateTime? ExpiresAt { get; set; }
}

public class CreateApiKeyResponse
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Key { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class CreateApiKeyEndpoint : Endpoint<CreateApiKeyRequest>
{
    private readonly AppDbContext _db;
    private readonly ILogger<CreateApiKeyEndpoint> _logger;

    public CreateApiKeyEndpoint(AppDbContext db, ILogger<CreateApiKeyEndpoint> logger)
    {
        _db = db;
        _logger = logger;
    }

    public override void Configure()
    {
        Post("/api-keys");
        AuthSchemes("JWT");
        Description(x => x.WithTags("API Keys"));
    }

    public override async Task HandleAsync(CreateApiKeyRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        if (string.IsNullOrWhiteSpace(req.Name))
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Name is required", ct);
            return;
        }

        // Generate secure API key
        var keyBytes = RandomNumberGenerator.GetBytes(32);
        var key = $"tfs_{Convert.ToBase64String(keyBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=')}";

        var apiKey = new ApiKey
        {
            UserId = userId,
            Name = req.Name.Trim(),
            Key = key,
            IsActive = true,
            ExpiresAt = req.ExpiresAt
        };

        _db.ApiKeys.Add(apiKey);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("API key created: {KeyId} for user {UserId}", apiKey.Id, userId);

        var response = new CreateApiKeyResponse
        {
            Id = apiKey.Id,
            Name = apiKey.Name,
            Key = key, // Only returned once at creation
            CreatedAt = apiKey.CreatedAt,
            ExpiresAt = apiKey.ExpiresAt
        };

        HttpContext.Response.StatusCode = 201;
        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}
