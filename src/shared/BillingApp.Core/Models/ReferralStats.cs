namespace BillingApp.Core.Models;

public class ReferralStats
{
    public int TotalReferrals { get; set; }
    public int ActiveProReferrals { get; set; }
    public int BonusDaysEarned { get; set; }
    public List<ReferralUser> RecentReferrals { get; set; } = new();
}

public class ReferralUser
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string SubscriptionType { get; set; } = "FREE";
    public DateTime? SubscriptionExpiry { get; set; }
    public bool IsPro { get; set; }
}
