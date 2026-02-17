using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;

namespace BillingApp.API.Controllers;

[Authorize]
public class ProductController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ProductController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Item>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var offset = (page - 1) * pageSize;
        var searchParam = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";

        var whereClause = @"WHERE ""ShopOwnerId"" = @ShopOwnerId 
                            AND (@Search IS NULL OR ""Name"" ILIKE @Search OR ""Category"" ILIKE @Search)";

        var sql = $@"
            SELECT * FROM ""Items"" 
            {whereClause}
            ORDER BY ""Id"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = $@"SELECT COUNT(*) FROM ""Items"" {whereClause}";

        var items = await connection.QueryAsync<Item>(sql, new { ShopOwnerId = shopOwnerId, Offset = offset, Limit = pageSize, Search = searchParam });
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { ShopOwnerId = shopOwnerId, Search = searchParam });

        return new BillingApp.Core.Models.PaginatedResult<Item>(items, totalCount, page, pageSize);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Item item)
    {
        item.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            INSERT INTO ""Items"" (""Name"", ""Price"", ""Category"", ""HSNCode"", ""GSTRate"", ""ShopOwnerId"", ""StockQuantity"", ""LowStockThreshold"")
            VALUES (@Name, @Price, @Category, @HSNCode, @GSTRate, @ShopOwnerId, @StockQuantity, @LowStockThreshold)
            RETURNING ""Id""";
        
        var id = await connection.ExecuteScalarAsync<int>(sql, item);
        return Ok(new { Id = id });
    }

    [HttpPut]
    public async Task<IActionResult> Update(Item item)
    {
        item.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            UPDATE ""Items"" 
            SET ""Name"" = @Name, ""Price"" = @Price, ""Category"" = @Category, 
                ""HSNCode"" = @HSNCode, ""GSTRate"" = @GSTRate, 
                ""StockQuantity"" = @StockQuantity, ""LowStockThreshold"" = @LowStockThreshold
            WHERE ""Id"" = @Id AND ""ShopOwnerId"" = @ShopOwnerId";
            
        var affected = await connection.ExecuteAsync(sql, item);
        return affected > 0 ? Ok() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(
            "DELETE FROM \"Items\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Id = id, ShopOwnerId = shopOwnerId });
            
        return affected > 0 ? Ok() : NotFound();
    }
}
