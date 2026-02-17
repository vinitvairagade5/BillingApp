namespace BillingApp.Core.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public string? UpiId { get; set; }
    public string? LogoUrl { get; set; }
    public string GstRates { get; set; } = "0,5,12,18,28";
    public string SubscriptionType { get; set; } = "FREE";
    public DateTime? SubscriptionExpiry { get; set; }
    public string? ReferralCode { get; set; }
    public int? ReferredById { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
