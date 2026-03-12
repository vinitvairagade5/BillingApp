namespace BillingApp.Core.Entities;

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? GSTIN { get; set; }
    public string? Address { get; set; }
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
