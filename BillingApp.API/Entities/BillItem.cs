namespace BillingApp.API.Entities;

public class BillItem
{
    public int Id { get; set; }
    public int BillId { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public Bill? Bill { get; set; }
    
    public int? ItemId { get; set; }
    
    public string ItemName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Discount { get; set; }
    public string? HSNCode { get; set; }
    public decimal CGST { get; set; }
    public decimal SGST { get; set; }
    public decimal IGST { get; set; }
    public decimal Total { get; set; }
}
