using BillingApp.Core.Abstractions;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using Dapper;

namespace BillingApp.Core.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SubscriptionService(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<ApiResult<bool>> CheckInvoiceLimitAsync(int userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        
        // 1. Check if user is PRO
        var user = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT \"SubscriptionType\", \"SubscriptionExpiry\" FROM \"Users\" WHERE \"Id\" = @userId", 
            new { userId });

        if (user == null) return ApiResult<bool>.Failure("User not found.");

        bool isPro = user.SubscriptionType == "PRO" && user.SubscriptionExpiry > DateTime.UtcNow;
        if (isPro) return ApiResult<bool>.Ok(true); // Unlimited for PRO

        // 2. Count invoices for FREE users (Limit: 10)
        var count = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM \"Bills\" WHERE \"ShopOwnerId\" = @userId", 
            new { userId });

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
            var activationCode = await connection.QuerySingleOrDefaultAsync<ActivationCode>(
                "SELECT * FROM \"ActivationCodes\" WHERE \"Code\" = @code AND \"IsRedeemed\" = FALSE", 
                new { code }, transaction);

            if (activationCode == null)
                return ApiResult<bool>.Failure("Invalid or already redeemed activation code.");

            // 2. Update Subscription
            var user = await connection.QuerySingleOrDefaultAsync<User>(
                "SELECT \"SubscriptionExpiry\" FROM \"Users\" WHERE \"Id\" = @userId", 
                new { userId }, transaction);

            DateTime currentExpiry = user.SubscriptionExpiry ?? DateTime.UtcNow;
            if (currentExpiry < DateTime.UtcNow) currentExpiry = DateTime.UtcNow;

            DateTime newExpiry = currentExpiry.AddDays(activationCode.DurationDays);

            await connection.ExecuteAsync(
                @"UPDATE ""Users"" 
                  SET ""SubscriptionType"" = 'PRO', ""SubscriptionExpiry"" = @newExpiry 
                  WHERE ""Id"" = @userId", 
                new { newExpiry, userId }, transaction);

            // 3. Mark Code as Redeemed
            await connection.ExecuteAsync(
                @"UPDATE ""ActivationCodes"" 
                  SET ""IsRedeemed"" = TRUE, ""RedeemedByUserId"" = @userId, ""RedeemedAt"" = @now 
                  WHERE ""Id"" = @id", 
                new { userId, now = DateTime.UtcNow, id = activationCode.Id }, transaction);

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
        using var connection = _connectionFactory.CreateConnection();
        var user = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT \"SubscriptionType\", \"SubscriptionExpiry\" FROM \"Users\" WHERE \"Id\" = @userId", 
            new { userId });

        return user != null && user.SubscriptionType == "PRO" && user.SubscriptionExpiry > DateTime.UtcNow;
    }

    public async Task<string> EnsureReferralCodeAsync(int userId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var code = await connection.ExecuteScalarAsync<string>(
            "SELECT \"ReferralCode\" FROM \"Users\" WHERE \"Id\" = @userId", new { userId });

        if (!string.IsNullOrEmpty(code)) return code;

        // Generate simple unique code (8 chars)
        code = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        await connection.ExecuteAsync(
            "UPDATE \"Users\" SET \"ReferralCode\" = @code WHERE \"Id\" = @userId", 
            new { code, userId });

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

                var sql = @"
                    INSERT INTO ""ActivationCodes"" (""Code"", ""DurationDays"", ""CreatedAt"") 
                    VALUES (@Code, @DurationDays, @CreatedAt) 
                    RETURNING *";
                
                var inserted = await connection.QuerySingleAsync<ActivationCode>(sql, activationCode, transaction);
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
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<ActivationCode>("SELECT * FROM \"ActivationCodes\" ORDER BY \"CreatedAt\" DESC");
    }
}
