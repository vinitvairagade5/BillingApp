namespace BillingApp.Core.Entities;

public class Item
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? Category { get; set; }
    public string? HSNCode { get; set; }
    public decimal GSTRate { get; set; }
    public int StockQuantity { get; set; }
    public int LowStockThreshold { get; set; } = 5;
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
}
