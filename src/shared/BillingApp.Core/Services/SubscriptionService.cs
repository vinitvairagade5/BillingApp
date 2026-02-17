using BillingApp.Core.Abstractions;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using Dapper;

namespace BillingApp.Core.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly ISubscriptionRepository _repository;

    public SubscriptionService(IDbConnectionFactory connectionFactory, ISubscriptionRepository repository)
    {
        _connectionFactory = connectionFactory;
        _repository = repository;
    }

    public async Task<ApiResult<bool>> CheckInvoiceLimitAsync(int userId)
    {
        var user = await _repository.GetUserAsync(userId);

        if (user == null) return ApiResult<bool>.Failure("User not found.");

        bool isPro = user.SubscriptionType == "PRO" && user.SubscriptionExpiry > DateTime.UtcNow;
        if (isPro) return ApiResult<bool>.Ok(true); // Unlimited for PRO

        var count = await _repository.GetInvoiceCountAsync(userId);
        
        if (count >= 10)
            return ApiResult<bool>.Failure("Free limit reached (10 invoices). Please upgrade to PRO.");

        return ApiResult<bool>.Ok(true);
    }

    public async Task<ApiResult<bool>> RedeemCodeAsync(int userId, string code)
    {
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            // 1. Validate Code
            var activationCode = await _repository.GetValidActivationCodeAsync(code, connection, transaction);

            if (activationCode == null)
                return ApiResult<bool>.Failure("Invalid or already redeemed activation code.");

            // 2. Update Subscription
            var user = await _repository.GetUserAsync(userId, connection, transaction);

            DateTime currentExpiry = user?.SubscriptionExpiry ?? DateTime.UtcNow;
            if (currentExpiry < DateTime.UtcNow) currentExpiry = DateTime.UtcNow;

            DateTime newExpiry = currentExpiry.AddDays(activationCode.DurationDays);

            await _repository.UpdateUserSubscriptionAsync(userId, "PRO", newExpiry, connection, transaction);

            // 3. Mark Code as Redeemed
            await _repository.MarkCodeRedeemedAsync(activationCode.Id, userId, DateTime.UtcNow, connection, transaction);

            transaction.Commit();
            return ApiResult<bool>.Ok(true, "Plan upgraded to PRO successfully!");
        }
        catch (Exception)
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> IsProAsync(int userId)
    {
        var user = await _repository.GetUserAsync(userId);
        return user != null && user.SubscriptionType == "PRO" && user.SubscriptionExpiry > DateTime.UtcNow;
    }

    public async Task<string> EnsureReferralCodeAsync(int userId)
    {
        var code = await _repository.GetReferralCodeAsync(userId);

        if (!string.IsNullOrEmpty(code)) return code;

        // Generate simple unique code (8 chars)
        code = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        await _repository.SetReferralCodeAsync(userId, code);

        return code;
    }

    public async Task<ApiResult<IEnumerable<ActivationCode>>> GenerateActivationCodesAsync(int count, int durationDays)
    {
        var codes = new List<ActivationCode>();
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            for (int i = 0; i < count; i++)
            {
                var codeString = $"{Guid.NewGuid().ToString("N").Substring(0, 4)}-{Guid.NewGuid().ToString("N").Substring(0, 4)}-{Guid.NewGuid().ToString("N").Substring(0, 4)}-{Guid.NewGuid().ToString("N").Substring(0, 4)}".ToUpper();
                
                var activationCode = new ActivationCode
                {
                    Code = codeString,
                    DurationDays = durationDays,
                    CreatedAt = DateTime.UtcNow
                };

                var inserted = await _repository.CreateActivationCodeAsync(activationCode, connection, transaction);
                codes.Add(inserted);
            }

            transaction.Commit();
            return ApiResult<IEnumerable<ActivationCode>>.Ok(codes, $"{count} codes generated successfully.");
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return ApiResult<IEnumerable<ActivationCode>>.Failure($"Failed to generate codes: {ex.Message}");
        }
    }

    public async Task<IEnumerable<ActivationCode>> GetAllActivationCodesAsync()
    {
        return await _repository.GetAllActivationCodesAsync();
    }

    public async Task<ReferralStats> GetReferralStatsAsync(int userId)
    {
        var referredUsersList = (await _repository.GetReferredUsersAsync(userId)).ToList();
        
        // Calculate stats
        var totalReferrals = referredUsersList.Count;
        var activeProReferrals = referredUsersList.Count(u => 
            u.SubscriptionType == "PRO" && 
            u.SubscriptionExpiry.HasValue && 
            u.SubscriptionExpiry.Value > DateTime.UtcNow);
        
        // Bonus days: 7 days for each active PRO referral
        var bonusDaysEarned = activeProReferrals * 7;
        
        // Mark users as PRO for display
        foreach (var user in referredUsersList)
        {
            user.IsPro = user.SubscriptionType == "PRO" && 
                        user.SubscriptionExpiry.HasValue && 
                        user.SubscriptionExpiry.Value > DateTime.UtcNow;
        }
        
        return new ReferralStats
        {
            TotalReferrals = totalReferrals,
            ActiveProReferrals = activeProReferrals,
            BonusDaysEarned = bonusDaysEarned,
            RecentReferrals = referredUsersList.Take(10).ToList()
        };
    }
}
