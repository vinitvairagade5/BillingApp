namespace BillingApp.Core.Entities;

public class Purchase
{
    public int Id { get; set; }
    public string InvoiceNo { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = "PAID";
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
    
    public List<PurchaseItem> Items { get; set; } = new();
}

public class PurchaseItem
{
    public int Id { get; set; }
    public int PurchaseId { get; set; }
    public int ItemId { get; set; }
    public Item? Item { get; set; }
    public int Quantity { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal Total { get; set; }
}
