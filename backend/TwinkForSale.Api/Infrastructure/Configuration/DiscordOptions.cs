namespace TwinkForSale.Api.Infrastructure.Configuration;

public sealed class DiscordOptions
{
    public const string SectionName = "Discord";

    public string ClientId { get; init; } = string.Empty;

    public string ClientSecret { get; init; } = string.Empty;

    public string BotToken { get; init; } = string.Empty;

    public string GuildId { get; init; } = string.Empty;
}
