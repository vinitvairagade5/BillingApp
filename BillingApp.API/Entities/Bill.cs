namespace BillingApp.API.Entities;

public class Bill
{
    public int Id { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    
    public int CustomerId { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public Customer? Customer { get; set; }
    
    public decimal SubTotal { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalCGST { get; set; }
    public decimal TotalSGST { get; set; }
    public decimal TotalIGST { get; set; }
    public decimal TotalAmount { get; set; }
    
    public int ShopOwnerId { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public User? ShopOwner { get; set; }
    
    public List<BillItem> Items { get; set; } = new();
}
