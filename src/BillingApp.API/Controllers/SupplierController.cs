using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;

namespace BillingApp.API.Controllers;

[Authorize]
public class SupplierController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;

    public SupplierController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Supplier>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var offset = (page - 1) * pageSize;
        var searchParam = string.IsNullOrWhiteSpace(search) ? null : $"%{search}%";

        var whereClause = @"WHERE ""ShopOwnerId"" = @ShopOwnerId 
                            AND (@Search IS NULL OR ""Name"" ILIKE @Search OR ""Contact"" ILIKE @Search)";

        var sql = $@"
            SELECT * FROM ""Suppliers"" 
            {whereClause}
            ORDER BY ""Id"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = $@"SELECT COUNT(*) FROM ""Suppliers"" {whereClause}";

        var items = await connection.QueryAsync<Supplier>(sql, new { ShopOwnerId = shopOwnerId, Offset = offset, Limit = pageSize, Search = searchParam });
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { ShopOwnerId = shopOwnerId, Search = searchParam });

        return new BillingApp.Core.Models.PaginatedResult<Supplier>(items, totalCount, page, pageSize);
    }

    [HttpGet("search")]
    public async Task<IEnumerable<Supplier>> Search(string query)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Supplier>(
            "SELECT * FROM \"Suppliers\" WHERE \"Name\" ILIKE @Query AND \"ShopOwnerId\" = @ShopOwnerId LIMIT 10", 
            new { Query = $"%{query}%", ShopOwnerId = shopOwnerId });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Supplier supplier)
    {
        supplier.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            INSERT INTO ""Suppliers"" (""Name"", ""Contact"", ""GSTIN"", ""Address"", ""ShopOwnerId"")
            VALUES (@Name, @Contact, @GSTIN, @Address, @ShopOwnerId)
            RETURNING ""Id""";
        
        var id = await connection.ExecuteScalarAsync<int>(sql, supplier);
        return Ok(new { Id = id });
    }

    [HttpPut]
    public async Task<IActionResult> Update(Supplier supplier)
    {
        supplier.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            UPDATE ""Suppliers"" 
            SET ""Name"" = @Name, ""Contact"" = @Contact, ""GSTIN"" = @GSTIN, ""Address"" = @Address
            WHERE ""Id"" = @Id AND ""ShopOwnerId"" = @ShopOwnerId";
            
        var affected = await connection.ExecuteAsync(sql, supplier);
        return affected > 0 ? Ok() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(
            "DELETE FROM \"Suppliers\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Id = id, ShopOwnerId = shopOwnerId });
            
        return affected > 0 ? Ok() : NotFound();
    }
}
