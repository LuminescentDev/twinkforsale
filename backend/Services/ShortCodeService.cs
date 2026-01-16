using System.Security.Cryptography;

namespace TwinkForSale.Api.Services;

public interface IShortCodeService
{
    string Generate(int length = 6);
    string GenerateFromWords(string[] words, int count = 3);
}

public class ShortCodeService : IShortCodeService
{
    private const string Alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public string Generate(int length = 6)
    {
        return RandomNumberGenerator.GetString(Alphabet, length);
    }

    public string GenerateFromWords(string[] words, int count = 3)
    {
        if (words.Length == 0)
        {
            return Generate();
        }

        var selectedWords = new string[count];
        for (var i = 0; i < count; i++)
        {
            selectedWords[i] = words[RandomNumberGenerator.GetInt32(words.Length)];
        }

        return string.Join("-", selectedWords);
    }
}
