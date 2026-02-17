using BillingApp.Core.Abstractions;
using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using Dapper;
using System.Data;

namespace BillingApp.Core.Data.Repositories;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SubscriptionRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    private IDbConnection GetConnection(IDbConnection? connection)
    {
        return connection ?? _connectionFactory.CreateConnection();
    }

    public async Task<User?> GetUserAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        return await db.QuerySingleOrDefaultAsync<User>(
            "SELECT \"SubscriptionType\", \"SubscriptionExpiry\" FROM \"Users\" WHERE \"Id\" = @userId", 
            new { userId }, transaction);
    }

    public async Task<int> GetInvoiceCountAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        return await db.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM \"Bills\" WHERE \"ShopOwnerId\" = @userId", 
            new { userId }, transaction);
    }

    public async Task<ActivationCode?> GetValidActivationCodeAsync(string code, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        return await db.QuerySingleOrDefaultAsync<ActivationCode>(
            "SELECT * FROM \"ActivationCodes\" WHERE \"Code\" = @code AND \"IsRedeemed\" = FALSE", 
            new { code }, transaction);
    }

    public async Task UpdateUserSubscriptionAsync(int userId, string type, DateTime expiry, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        await db.ExecuteAsync(
            @"UPDATE ""Users"" 
              SET ""SubscriptionType"" = @type, ""SubscriptionExpiry"" = @expiry 
              WHERE ""Id"" = @userId", 
            new { type, expiry, userId }, transaction);
    }

    public async Task MarkCodeRedeemedAsync(int activationCodeId, int userId, DateTime redeemedAt, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        await db.ExecuteAsync(
            @"UPDATE ""ActivationCodes"" 
              SET ""IsRedeemed"" = TRUE, ""RedeemedByUserId"" = @userId, ""RedeemedAt"" = @redeemedAt 
              WHERE ""Id"" = @id", 
            new { userId, redeemedAt, id = activationCodeId }, transaction);
    }

    public async Task<string?> GetReferralCodeAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        return await db.ExecuteScalarAsync<string>(
            "SELECT \"ReferralCode\" FROM \"Users\" WHERE \"Id\" = @userId", new { userId }, transaction);
    }

    public async Task SetReferralCodeAsync(int userId, string code, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        await db.ExecuteAsync(
            "UPDATE \"Users\" SET \"ReferralCode\" = @code WHERE \"Id\" = @userId", 
            new { code, userId }, transaction);
    }

    public async Task<ActivationCode> CreateActivationCodeAsync(ActivationCode code, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        var sql = @"
            INSERT INTO ""ActivationCodes"" (""Code"", ""DurationDays"", ""CreatedAt"") 
            VALUES (@Code, @DurationDays, @CreatedAt) 
            RETURNING *";
        
        return await db.QuerySingleAsync<ActivationCode>(sql, code, transaction);
    }

    public async Task<IEnumerable<ActivationCode>> GetAllActivationCodesAsync(IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        return await db.QueryAsync<ActivationCode>("SELECT * FROM \"ActivationCodes\" ORDER BY \"CreatedAt\" DESC", transaction: transaction);
    }

    public async Task<IEnumerable<ReferralUser>> GetReferredUsersAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null)
    {
        var db = GetConnection(connection);
        return await db.QueryAsync<ReferralUser>(@"
            SELECT 
                ""Id"", 
                ""Username"", 
                ""ShopName"", 
                ""CreatedAt"", 
                ""SubscriptionType"",
                ""SubscriptionExpiry""
            FROM ""Users"" 
            WHERE ""ReferredById"" = @userId
            ORDER BY ""CreatedAt"" DESC",
            new { userId }, transaction);
    }
}
