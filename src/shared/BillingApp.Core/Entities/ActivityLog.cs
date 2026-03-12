namespace BillingApp.Core.Entities;

public class ActivityLog
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public User? User { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public int ShopOwnerId { get; set; }
    public User? ShopOwner { get; set; }
}
