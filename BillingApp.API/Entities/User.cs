namespace BillingApp.API.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public string? LogoUrl { get; set; }
    public string GstRates { get; set; } = "0,5,12,18,28";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
