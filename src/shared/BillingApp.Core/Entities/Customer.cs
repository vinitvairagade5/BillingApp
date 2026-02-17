namespace BillingApp.Core.Entities;

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
}
