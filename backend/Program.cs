using FastEndpoints;
using FastEndpoints.Swagger;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Sinks.Grafana.Loki;
using TwinkForSale.Api.Data;
using TwinkForSale.Api.Services;
using TwinkForSale.Api.Services.Auth;
using TwinkForSale.Api.Services.Image;
using TwinkForSale.Api.Services.Storage;

var builder = WebApplication.CreateBuilder(args);

// Listen on all interfaces by default
builder.WebHost.UseUrls("http://0.0.0.0:5000");

// Configure Serilog with Loki
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "TwinkForSale.Api")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .WriteTo.Console()
    .WriteTo.GrafanaLoki(
        builder.Configuration["Loki:Url"] ?? "http://localhost:3100",
        labels: [
            new LokiLabel { Key = "app", Value = "twinkforsale" },
            new LokiLabel { Key = "env", Value = builder.Environment.EnvironmentName }
        ])
    .CreateLogger();

builder.Host.UseSerilog();

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Auth services
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddHttpClient<IDiscordOAuthService, DiscordOAuthService>();

// Storage service - use local or S3 based on config
if (!string.IsNullOrEmpty(builder.Configuration["Storage:S3:BucketName"]))
{
    builder.Services.AddSingleton<IStorageService, S3StorageService>();
}
else
{
    builder.Services.AddSingleton<IStorageService, LocalStorageService>();
}

// Image processing
builder.Services.AddSingleton<IImageService, ImageSharpService>();

// Short code generation
builder.Services.AddSingleton<IShortCodeService, ShortCodeService>();

// Authentication - JWT + API Key
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "JWT";
    options.DefaultChallengeScheme = "JWT";
})
.AddScheme<AuthenticationSchemeOptions, ApiKeyAuthHandler>("ApiKey", null)
.AddJwtBearer("JWT", options =>
{
    options.TokenValidationParameters = new()
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// FastEndpoints
builder.Services.AddFastEndpoints();
builder.Services.SwaggerDocument(o =>
{
    o.DocumentSettings = s =>
    {
        s.Title = "TwinkForSale API";
        s.Version = "v1";
        s.Description = "File hosting and sharing service API";
    };
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                builder.Configuration["Cors:Origins"]?.Split(',') ?? ["http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure pipeline
app.UseSerilogRequestLogging();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseFastEndpoints(c =>
{
    c.Endpoints.RoutePrefix = "api";
});
app.UseSwaggerGen();

// Auto-migrate in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
