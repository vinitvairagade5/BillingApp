namespace BillingApp.Core.Entities;

public class ActivationCode
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int DurationDays { get; set; } = 365;
    public bool IsRedeemed { get; set; }
    public int? RedeemedByUserId { get; set; }
    public DateTime? RedeemedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
