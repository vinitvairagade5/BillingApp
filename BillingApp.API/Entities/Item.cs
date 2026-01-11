namespace BillingApp.API.Entities;

public class Item
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Category { get; set; }
    public string? HSNCode { get; set; }
    public decimal GSTRate { get; set; }
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
}
