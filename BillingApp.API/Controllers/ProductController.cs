using BillingApp.API.Data;
using BillingApp.API.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductController : ControllerBase
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ProductController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<IEnumerable<Item>> Get(int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        return await connection.QueryAsync<Item>(
            "SELECT * FROM \"Items\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { ShopOwnerId = shopOwnerId });
    }

    [HttpPost]
    public async Task<IActionResult> Create(Item item)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            INSERT INTO ""Items"" (""Name"", ""Price"", ""Category"", ""HSNCode"", ""GSTRate"", ""ShopOwnerId"")
            VALUES (@Name, @Price, @Category, @HSNCode, @GSTRate, @ShopOwnerId)
            RETURNING ""Id""";
        
        var id = await connection.ExecuteScalarAsync<int>(sql, item);
        return Ok(new { Id = id });
    }

    [HttpPut]
    public async Task<IActionResult> Update(Item item)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            UPDATE ""Items"" 
            SET ""Name"" = @Name, ""Price"" = @Price, ""Category"" = @Category, 
                ""HSNCode"" = @HSNCode, ""GSTRate"" = @GSTRate
            WHERE ""Id"" = @Id AND ""ShopOwnerId"" = @ShopOwnerId";
            
        var affected = await connection.ExecuteAsync(sql, item);
        return affected > 0 ? Ok() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var affected = await connection.ExecuteAsync(
            "DELETE FROM \"Items\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Id = id, ShopOwnerId = shopOwnerId });
            
        return affected > 0 ? Ok() : NotFound();
    }
}
