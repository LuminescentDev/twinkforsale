using FastEndpoints;
using FastEndpoints.Swagger;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using TwinkForSale.Api.Infrastructure.Configuration;
using TwinkForSale.Api.Infrastructure.Auth;
using TwinkForSale.Api.Infrastructure.Database;
using TwinkForSale.Api.Infrastructure.Storage;
using TwinkForSale.Api.Features.Uploads;
using TwinkForSale.Api.Features.ShortLinks;
using TwinkForSale.Api.Features.Analytics;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddInMemoryCollection(BuildLegacyEnvironmentConfiguration());

builder.Services.Configure<AppOptions>(builder.Configuration.GetSection(AppOptions.SectionName));
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection(StorageOptions.SectionName));
builder.Services.Configure<DiscordOptions>(builder.Configuration.GetSection(DiscordOptions.SectionName));
builder.Services.Configure<AuthOptions>(builder.Configuration.GetSection(AuthOptions.SectionName));
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                               ForwardedHeaders.XForwardedHost |
                               ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var frontendUrl = builder.Configuration.GetSection(AppOptions.SectionName).Get<AppOptions>()?.FrontendUrl;

        if (builder.Environment.IsDevelopment())
        {
            policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri) &&
                (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                 uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
                 uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase)))
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else if (!string.IsNullOrWhiteSpace(frontendUrl))
        {
            policy.WithOrigins(frontendUrl)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default")
        ?? "Host=localhost;Port=5432;Database=twinkforsale;Username=postgres;Password=postgres";

    options.UseNpgsql(connectionString);
});

builder.Services
    .AddAuthentication(ApiKeyAuthenticationDefaults.Scheme)
    .AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(ApiKeyAuthenticationDefaults.Scheme, _ => { });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.ApprovedUser, policy =>
    {
        policy.AddAuthenticationSchemes(ApiKeyAuthenticationDefaults.Scheme);
        policy.RequireAuthenticatedUser();
        policy.RequireClaim(AppClaimTypes.IsApproved, "true");
    });

    options.AddPolicy(AuthPolicies.Admin, policy =>
    {
        policy.AddAuthenticationSchemes(ApiKeyAuthenticationDefaults.Scheme);
        policy.RequireAuthenticatedUser();
        policy.RequireClaim(AppClaimTypes.IsAdmin, "true");
    });
});

builder.Services.AddScoped<LocalFileStorage>();
builder.Services.AddScoped<R2FileStorage>();
builder.Services.AddScoped<IFileStorage>(sp =>
{
    var storageOptions = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<StorageOptions>>().Value;
    return storageOptions.Provider.Equals("R2", StringComparison.OrdinalIgnoreCase) ||
           storageOptions.Provider.Equals("S3", StringComparison.OrdinalIgnoreCase)
        ? sp.GetRequiredService<R2FileStorage>()
        : sp.GetRequiredService<LocalFileStorage>();
});
builder.Services.AddScoped<UploadCodeGenerator>();
builder.Services.AddScoped<ShortLinkCodeGenerator>();
builder.Services.AddScoped<AnalyticsService>();
builder.Services.AddHttpClient();

builder.Services.AddFastEndpoints();
builder.Services.SwaggerDocument(options =>
{
    options.DocumentSettings = settings =>
    {
        settings.Title = "TwinkForSale API";
        settings.Version = "v1";
        settings.Description = "Backend API for uploads, short links, bio pages, dashboard, and admin operations.";
    };
});

var app = builder.Build();

app.UseForwardedHeaders();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();
}

app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseFastEndpoints();
app.UseSwaggerGen();

app.Run();

static Dictionary<string, string?> BuildLegacyEnvironmentConfiguration()
{
    var values = new Dictionary<string, string?>();

    AddIfModernEnvironmentMissing(values, "App__BaseUrl", "App:BaseUrl", "BASE_URL");
    AddIfModernEnvironmentMissing(values, "Discord__BotToken", "Discord:BotToken", "DISCORD_BOT_TOKEN");
    AddIfModernEnvironmentMissing(values, "Discord__GuildId", "Discord:GuildId", "DISCORD_GUILD_ID");
    AddIfModernEnvironmentMissing(values, "Storage__LocalPath", "Storage:LocalPath", "UPLOAD_DIR");
    AddIfModernEnvironmentMissing(values, "Storage__R2__AccountId", "Storage:R2:AccountId", "R2_ACCOUNT_ID");
    AddIfModernEnvironmentMissing(values, "Storage__R2__AccessKeyId", "Storage:R2:AccessKeyId", "R2_ACCESS_KEY_ID");
    AddIfModernEnvironmentMissing(values, "Storage__R2__SecretAccessKey", "Storage:R2:SecretAccessKey", "R2_SECRET_ACCESS_KEY");
    AddIfModernEnvironmentMissing(values, "Storage__R2__BucketName", "Storage:R2:BucketName", "R2_BUCKET_NAME");
    AddIfModernEnvironmentMissing(values, "Storage__R2__PublicUrl", "Storage:R2:PublicUrl", "R2_PUBLIC_URL");

    var modernProvider = Environment.GetEnvironmentVariable("Storage__Provider");
    var storageProvider = Environment.GetEnvironmentVariable("STORAGE_PROVIDER");
    if (string.IsNullOrWhiteSpace(modernProvider) && !string.IsNullOrWhiteSpace(storageProvider))
    {
        values["Storage:Provider"] = storageProvider;
    }

    var legacyUseR2 = Environment.GetEnvironmentVariable("USE_R2_STORAGE");
    if (string.IsNullOrWhiteSpace(modernProvider) &&
        string.IsNullOrWhiteSpace(storageProvider) &&
        string.Equals(legacyUseR2, "true", StringComparison.OrdinalIgnoreCase))
    {
        values["Storage:Provider"] = "R2";
    }

    return values;
}

static void AddIfModernEnvironmentMissing(
    Dictionary<string, string?> values,
    string modernEnvironmentName,
    string configurationKey,
    string legacyEnvironmentName)
{
    if (!string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(modernEnvironmentName)))
    {
        return;
    }

    var legacyValue = Environment.GetEnvironmentVariable(legacyEnvironmentName);
    if (!string.IsNullOrWhiteSpace(legacyValue))
    {
        values[configurationKey] = legacyValue;
    }
}
