using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;

namespace BillingApp.API.Controllers;

[Authorize]
public class StaffController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;

    public StaffController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<IActionResult> GetStaff()
    {
        var ownerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var staff = await connection.QueryAsync<UserDto>(
            "SELECT \"Id\", \"Username\", \"Role\", \"CreatedAt\" FROM \"Users\" WHERE \"ParentShopId\" = @ownerId ORDER BY \"Id\" DESC",
            new { ownerId });
        return Ok(staff);
    }

    [HttpPost]
    public async Task<IActionResult> AddStaff([FromBody] AddStaffRequest request)
    {
        var ownerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var owner = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT \"ShopName\" FROM \"Users\" WHERE \"Id\" = @ownerId", new { ownerId });
            
        if (owner == null) return BadRequest("Owner not found");

        var exists = await connection.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM \"Users\" WHERE \"Username\" = @Username)", 
            new { request.Username });
            
        if (exists) return BadRequest("Username already taken. Please choose another one.");

        var hash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        
        var sql = @"
            INSERT INTO ""Users"" (""Username"", ""PasswordHash"", ""ShopName"", ""Role"", ""ParentShopId"")
            VALUES (@Username, @PasswordHash, @ShopName, 'CASHIER', @ParentShopId) RETURNING ""Id""";
            
        var id = await connection.ExecuteScalarAsync<int>(sql, new {
            Username = request.Username,
            PasswordHash = hash,
            ShopName = owner.ShopName,
            ParentShopId = ownerId
        });

        return Ok(new { Id = id });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var ownerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var affected = await connection.ExecuteAsync(
            "DELETE FROM \"Users\" WHERE \"Id\" = @Id AND \"ParentShopId\" = @ParentShopId",
            new { Id = id, ParentShopId = ownerId });
            
        return affected > 0 ? Ok() : NotFound();
    }
}

public class AddStaffRequest 
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
