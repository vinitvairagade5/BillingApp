namespace BillingApp.Core.Models;

public class CustomerBalanceDto
{
    public int CustomerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public decimal Balance { get; set; }
}
