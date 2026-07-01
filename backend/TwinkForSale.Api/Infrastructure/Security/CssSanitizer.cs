using System.Text.RegularExpressions;

namespace TwinkForSale.Api.Infrastructure.Security;

public static partial class CssSanitizer
{
    private const int MaxLength = 20_000;

    public static string? Sanitize(string? css)
    {
        if (string.IsNullOrWhiteSpace(css)) return null;

        var sanitized = css.Length > MaxLength ? css[..MaxLength] : css;
        sanitized = CommentsRegex().Replace(sanitized, string.Empty);
        sanitized = ImportRegex().Replace(sanitized, string.Empty);
        sanitized = DangerousFunctionsRegex().Replace(sanitized, string.Empty);
        sanitized = DangerousPropertiesRegex().Replace(sanitized, string.Empty);
        sanitized = DangerousAtRulesRegex().Replace(sanitized, string.Empty);
        sanitized = ScriptLikeTokensRegex().Replace(sanitized, string.Empty);

        return string.IsNullOrWhiteSpace(sanitized) ? null : sanitized.Trim();
    }

    [GeneratedRegex(@"/\*.*?\*/", RegexOptions.Singleline)]
    private static partial Regex CommentsRegex();

    [GeneratedRegex(@"@import\s+[^;]+;", RegexOptions.IgnoreCase)]
    private static partial Regex ImportRegex();

    [GeneratedRegex(@"(expression|url)\s*\(\s*(['""]?\s*)?(javascript|vbscript|data:text/html)[^)]*\)", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousFunctionsRegex();

    [GeneratedRegex(@"(^|[;{}])\s*(behavior|-moz-binding)\s*:[^;{}]*", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousPropertiesRegex();

    [GeneratedRegex(@"@(document|namespace)\b[^{}]*(\{[^{}]*\})?", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousAtRulesRegex();

    [GeneratedRegex(@"</?\s*(script|iframe|object|embed|link|meta|style)\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex ScriptLikeTokensRegex();
}
