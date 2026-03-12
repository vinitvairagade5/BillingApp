namespace BillingApp.Core.Entities;

public class Expense
{
    public int Id { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
}
