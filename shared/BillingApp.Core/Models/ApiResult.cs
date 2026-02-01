namespace BillingApp.Core.Models;

public class ApiResult<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? ErrorCode { get; set; }

    public static ApiResult<T> Ok(T data, string? message = null) => 
        new() { Success = true, Data = data, Message = message };

    public static ApiResult<T> Failure(string message, string? errorCode = null) => 
        new() { Success = false, Message = message, ErrorCode = errorCode };
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiry { get; set; }
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string ShopName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public string? SubscriptionType { get; set; }
    public DateTime? SubscriptionExpiry { get; set; }
    public string? ReferralCode { get; set; }
    public string? UpiId { get; set; }
    public string? Address { get; set; }
    public string? GSTIN { get; set; }
    public string? LogoUrl { get; set; }
    public string? GstRates { get; set; }
}
