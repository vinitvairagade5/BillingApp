using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;

namespace BillingApp.API.Controllers;

[Authorize]
public class ExpenseController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ExpenseController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Expense>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? category = null)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var offset = (page - 1) * pageSize;

        var whereClause = @"WHERE ""ShopOwnerId"" = @ShopOwnerId AND (@Category IS NULL OR ""Category"" = @Category)";

        var sql = $@"
            SELECT * FROM ""Expenses"" 
            {whereClause}
            ORDER BY ""Date"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = $@"SELECT COUNT(*) FROM ""Expenses"" {whereClause}";

        var items = await connection.QueryAsync<Expense>(sql, new { ShopOwnerId = shopOwnerId, Offset = offset, Limit = pageSize, Category = category });
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { ShopOwnerId = shopOwnerId, Category = category });

        return new BillingApp.Core.Models.PaginatedResult<Expense>(items, totalCount, page, pageSize);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Expense expense)
    {
        expense.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            INSERT INTO ""Expenses"" (""Date"", ""Category"", ""Amount"", ""Description"", ""ShopOwnerId"")
            VALUES (@Date, @Category, @Amount, @Description, @ShopOwnerId)
            RETURNING ""Id""";
        
        var id = await connection.ExecuteScalarAsync<int>(sql, expense);
        return Ok(new { Id = id });
    }

    [HttpPut]
    public async Task<IActionResult> Update(Expense expense)
    {
        expense.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            UPDATE ""Expenses"" 
            SET ""Date"" = @Date, ""Category"" = @Category, ""Amount"" = @Amount, ""Description"" = @Description
            WHERE ""Id"" = @Id AND ""ShopOwnerId"" = @ShopOwnerId";
            
        var affected = await connection.ExecuteAsync(sql, expense);
        return affected > 0 ? Ok() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(
            "DELETE FROM \"Expenses\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Id = id, ShopOwnerId = shopOwnerId });
            
        return affected > 0 ? Ok() : NotFound();
    }
}
