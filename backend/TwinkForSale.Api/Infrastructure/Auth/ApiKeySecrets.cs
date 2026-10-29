using System.Security.Cryptography;
using System.Text;

namespace TwinkForSale.Api.Infrastructure.Auth;

public static class ApiKeySecrets
{
    public static string Hash(string key) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key))).ToLowerInvariant();

    public static string Mask(string key) => key.Length <= 8 ? "********" : $"{key[..4]}...{key[^4..]}";
}
