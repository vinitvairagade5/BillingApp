using BillingApp.Core.Models;
using BillingApp.Core.Entities;

namespace BillingApp.Core.Abstractions;

public interface ISubscriptionService
{
    Task<ApiResult<bool>> RedeemCodeAsync(int userId, string code);
    Task<ApiResult<bool>> CheckInvoiceLimitAsync(int userId);
    Task<bool> IsProAsync(int userId);
    Task<string> EnsureReferralCodeAsync(int userId);
    Task<ReferralStats> GetReferralStatsAsync(int userId);

    // Admin Methods
    Task<ApiResult<IEnumerable<ActivationCode>>> GenerateActivationCodesAsync(int count, int durationDays);
    Task<IEnumerable<ActivationCode>> GetAllActivationCodesAsync();
}
