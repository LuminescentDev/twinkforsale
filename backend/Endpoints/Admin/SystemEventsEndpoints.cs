using System.Security.Claims;
using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Entities;

namespace TwinkForSale.Api.Endpoints.Admin;

public class CreateSystemEventRequest
{
    public string Type { get; set; } = null!;
    public string Severity { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? UserId { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    public double? CpuUsage { get; set; }
    public double? MemoryUsage { get; set; }
    public double? DiskUsage { get; set; }
}

public class SystemEventDto
{
    public string Id { get; set; } = null!;
    public string Type { get; set; } = null!;
    public string Severity { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? Metadata { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserName { get; set; }
    public double? CpuUsage { get; set; }
    public double? MemoryUsage { get; set; }
    public double? DiskUsage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ListSystemEventsRequest
{
    public int Limit { get; set; } = 50;
    public string? Severity { get; set; }
    public string? UserId { get; set; }
}

public class SystemEventsStatsRequest
{
    public int Hours { get; set; } = 24;
}

public class SystemEventsStatsResponse
{
    public Dictionary<string, int> Counts { get; set; } = [];
}

public class CreateSystemEventEndpoint(AppDbContext db) : Endpoint<CreateSystemEventRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Post("/admin/system-events");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CreateSystemEventRequest req, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.StatusCode = 401;
            return;
        }

        var metadataJson = req.Metadata != null ? JsonSerializer.Serialize(req.Metadata) : null;

        var systemEvent = new SystemEvent
        {
            Type = req.Type,
            Severity = req.Severity,
            Title = req.Title,
            Message = req.Message,
            Metadata = metadataJson,
            UserId = req.UserId,
            CpuUsage = req.CpuUsage,
            MemoryUsage = req.MemoryUsage,
            DiskUsage = req.DiskUsage
        };

        _db.SystemEvents.Add(systemEvent);
        await _db.SaveChangesAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new { id = systemEvent.Id }, (JsonSerializerOptions?)null, ct);
    }
}

public class ListSystemEventsEndpoint(AppDbContext db) : Endpoint<ListSystemEventsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/system-events");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(ListSystemEventsRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var limit = Math.Clamp(req.Limit, 1, 200);

        var query = _db.SystemEvents
            .Include(e => e.User)
            .OrderByDescending(e => e.CreatedAt)
            .AsQueryable();

        if (!string.IsNullOrEmpty(req.Severity))
        {
            query = query.Where(e => e.Severity == req.Severity);
        }

        if (!string.IsNullOrEmpty(req.UserId))
        {
            query = query.Where(e => e.UserId == req.UserId);
        }

        var events = await query
            .Take(limit)
            .Select(e => new SystemEventDto
            {
                Id = e.Id,
                Type = e.Type,
                Severity = e.Severity,
                Title = e.Title,
                Message = e.Message,
                Metadata = e.Metadata,
                UserId = e.UserId,
                UserEmail = e.User != null ? e.User.Email : null,
                UserName = e.User != null ? e.User.Name : null,
                CpuUsage = e.CpuUsage,
                MemoryUsage = e.MemoryUsage,
                DiskUsage = e.DiskUsage,
                CreatedAt = e.CreatedAt
            })
            .ToListAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, events, (JsonSerializerOptions?)null, ct);
    }
}

public class SystemEventsStatsEndpoint(AppDbContext db) : Endpoint<SystemEventsStatsRequest>
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Get("/admin/system-events/stats");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(SystemEventsStatsRequest req, CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var hours = Math.Clamp(req.Hours, 1, 168);
        var since = DateTime.UtcNow.AddHours(-hours);

        var stats = await _db.SystemEvents
            .Where(e => e.CreatedAt >= since)
            .GroupBy(e => e.Severity)
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var response = new SystemEventsStatsResponse
        {
            Counts = stats.ToDictionary(s => s.Severity, s => s.Count)
        };

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, response, (JsonSerializerOptions?)null, ct);
    }
}

public class CleanupSystemEventsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Post("/admin/system-events/cleanup");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var cutoffDate = DateTime.UtcNow.AddDays(-30);
        var result = await _db.SystemEvents
            .Where(e => e.CreatedAt < cutoffDate)
            .ExecuteDeleteAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new { deletedCount = result }, (JsonSerializerOptions?)null, ct);
    }
}

public class DeleteSystemEventEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Delete("/admin/system-events/{id}");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var id = Route<string>("id");
        var deleted = await _db.SystemEvents
            .Where(e => e.Id == id)
            .ExecuteDeleteAsync(ct);

        if (deleted == 0)
        {
            HttpContext.Response.StatusCode = 404;
            return;
        }

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new { success = true }, (JsonSerializerOptions?)null, ct);
    }
}

public class ClearSystemEventsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Delete("/admin/system-events");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var severity = Query<string>("severity", false);

        var query = _db.SystemEvents.AsQueryable();
        if (!string.IsNullOrEmpty(severity))
        {
            query = query.Where(e => e.Severity == severity);
        }

        var deleted = await query.ExecuteDeleteAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new { deletedCount = deleted }, (JsonSerializerOptions?)null, ct);
    }
}

public class ClearNonCriticalEventsEndpoint(AppDbContext db) : EndpointWithoutRequest
{
    private readonly AppDbContext _db = db;

  public override void Configure()
    {
        Delete("/admin/system-events/non-critical");
        AuthSchemes("JWT");
        Description(x => x.WithTags("Admin"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var isAdmin = User.FindFirstValue("isAdmin");
        if (isAdmin != "True")
        {
            HttpContext.Response.StatusCode = 403;
            return;
        }

        var deleted = await _db.SystemEvents
            .Where(e => e.Severity == "INFO" || e.Severity == "WARNING")
            .ExecuteDeleteAsync(ct);

        HttpContext.Response.ContentType = "application/json";
        await JsonSerializer.SerializeAsync(HttpContext.Response.Body, new { deletedCount = deleted }, (JsonSerializerOptions?)null, ct);
    }
}
