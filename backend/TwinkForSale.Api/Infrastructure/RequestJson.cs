using System.Text.Json;

namespace TwinkForSale.Api.Infrastructure;

internal static class RequestJson
{
    public static async Task<T?> ReadAsync<T>(HttpRequest request, CancellationToken ct) where T : class
    {
        if (!request.HasJsonContentType()) return null;
        try { return await request.ReadFromJsonAsync<T>(ct); }
        catch (JsonException) { return null; }
    }
}
