namespace TwinkForSale.Api.Domain.Entities;

public static class EntityIds
{
    public static string NewId() => Guid.NewGuid().ToString("N");
}
