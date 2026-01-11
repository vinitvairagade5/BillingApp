using BillingApp.API.Data;
using BillingApp.API.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly IDbConnectionFactory _connectionFactory;

    public CustomerController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<IEnumerable<Customer>> Get(int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Customer>(
            "SELECT * FROM \"Customers\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { ShopOwnerId = shopOwnerId });
    }

    [HttpGet("search")]
    public async Task<IEnumerable<Customer>> Search(string mobile, int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Customer>(
            "SELECT * FROM \"Customers\" WHERE \"Mobile\" LIKE @Mobile AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Mobile = $"%{mobile}%", ShopOwnerId = shopOwnerId });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Customer customer)
    {
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
