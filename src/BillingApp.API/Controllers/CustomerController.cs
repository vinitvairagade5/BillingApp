using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;

namespace BillingApp.API.Controllers;

[Authorize]
public class CustomerController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;

    public CustomerController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Customer>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var offset = (page - 1) * pageSize;

        var sql = @"
            SELECT * FROM ""Customers"" 
            WHERE ""ShopOwnerId"" = @ShopOwnerId 
            ORDER BY ""Id"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = @"SELECT COUNT(*) FROM ""Customers"" WHERE ""ShopOwnerId"" = @ShopOwnerId";

        var items = await connection.QueryAsync<Customer>(sql, new { ShopOwnerId = shopOwnerId, Offset = offset, Limit = pageSize });
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { ShopOwnerId = shopOwnerId });

        return new BillingApp.Core.Models.PaginatedResult<Customer>(items, totalCount, page, pageSize);
    }

    [HttpGet("search")]
    public async Task<IEnumerable<Customer>> Search(string mobile)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Customer>(
            "SELECT * FROM \"Customers\" WHERE \"Mobile\" LIKE @Mobile AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Mobile = $"%{mobile}%", ShopOwnerId = shopOwnerId });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Customer customer)
    {
        customer.ShopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            INSERT INTO ""Customers"" (""Name"", ""Mobile"", ""Address"", ""ShopOwnerId"")
            VALUES (@Name, @Mobile, @Address, @ShopOwnerId)
            ON CONFLICT (""Mobile"", ""ShopOwnerId"") DO UPDATE 
            SET ""Name"" = @Name, ""Address"" = @Address
            RETURNING ""Id""";
        
        var id = await connection.ExecuteScalarAsync<int>(sql, customer);
        return Ok(new { Id = id });
    }
}
