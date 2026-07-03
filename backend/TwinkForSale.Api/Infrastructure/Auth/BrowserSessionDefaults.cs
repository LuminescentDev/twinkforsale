namespace TwinkForSale.Api.Infrastructure.Auth;

public static class BrowserSessionDefaults
{
    public const string SessionCookieName = "tfs_session";
    public const string OAuthStateCookieName = "tfs_oauth_state";
    public const int SessionDays = 30;
}
