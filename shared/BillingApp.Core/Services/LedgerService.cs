using BillingApp.Core.Abstractions;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using Dapper;

namespace BillingApp.Core.Services;

public class LedgerService : ILedgerService
{
    private readonly IDbConnectionFactory _connectionFactory;

    public LedgerService(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<ApiResult<bool>> RecordTransactionAsync(CustomerLedger entry)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            INSERT INTO ""CustomerLedger"" (
                ""CustomerId"", ""BillId"", ""Date"", ""Type"", ""Amount"", ""Description"", ""ShopOwnerId""
            ) VALUES (
                @CustomerId, @BillId, @Date, @Type, @Amount, @Description, @ShopOwnerId
            )";
        
        await connection.ExecuteAsync(sql, entry);
        return ApiResult<bool>.Ok(true, "Transaction recorded successfully.");
    }

    public async Task<decimal> GetCustomerBalanceAsync(int customerId, int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            SELECT 
                COALESCE(SUM(CASE WHEN ""Type"" = 'DEBIT' THEN ""Amount"" ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN ""Type"" = 'CREDIT' THEN ""Amount"" ELSE 0 END), 0)
            FROM ""CustomerLedger""
            WHERE ""CustomerId"" = @customerId AND ""ShopOwnerId"" = @shopOwnerId";
        
        return await connection.ExecuteScalarAsync<decimal>(sql, new { customerId, shopOwnerId });
    }

    public async Task<IEnumerable<CustomerLedger>> GetCustomerHistoryAsync(int customerId, int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            SELECT * FROM ""CustomerLedger"" 
            WHERE ""CustomerId"" = @customerId AND ""ShopOwnerId"" = @shopOwnerId 
            ORDER BY ""Date"" DESC";
        
        return await connection.QueryAsync<CustomerLedger>(sql, new { customerId, shopOwnerId });
    }

    public async Task<IEnumerable<CustomerBalanceDto>> GetAllBalancesAsync(int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            SELECT 
                c.""Id"" as CustomerId,
                c.""Name"",
                c.""Mobile"",
                COALESCE(SUM(CASE WHEN l.""Type"" = 'DEBIT' THEN l.""Amount"" ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN l.""Type"" = 'CREDIT' THEN l.""Amount"" ELSE 0 END), 0) as Balance
            FROM ""Customers"" c
            LEFT JOIN ""CustomerLedger"" l ON c.""Id"" = l.""CustomerId""
            WHERE c.""ShopOwnerId"" = @shopOwnerId
            GROUP BY c.""Id"", c.""Name"", c.""Mobile""
            HAVING COALESCE(SUM(CASE WHEN l.""Type"" = 'DEBIT' THEN l.""Amount"" ELSE 0 END), 0) -
                   COALESCE(SUM(CASE WHEN l.""Type"" = 'CREDIT' THEN l.""Amount"" ELSE 0 END), 0) != 0
            ORDER BY Balance DESC";
        
        return await connection.QueryAsync<CustomerBalanceDto>(sql, new { shopOwnerId });
    }
}
