namespace BillingApp.Core.Entities;

public class CustomerLedger
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? BillId { get; set; }
    public Bill? Bill { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string Type { get; set; } = "DEBIT"; // DEBIT or CREDIT
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public int ShopOwnerId { get; set; }
}
