using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Abstractions;
using BillingApp.Core.Models;
using BillingApp.Core.Controllers;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

public class AuthController : BaseApiController
{
    private readonly IIdentityService _identityService;
    private readonly IDbConnectionFactory _connectionFactory;

    public AuthController(IIdentityService identityService, IDbConnectionFactory connectionFactory)
    {
        _identityService = identityService;
        _connectionFactory = connectionFactory;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var user = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM \"Users\" WHERE \"Id\" = @userId", new { userId });
        
        if (user == null) return NotFound();

        var dto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            ShopName = user.ShopName,
            IsAdmin = user.IsAdmin,
            SubscriptionType = user.SubscriptionType,
            SubscriptionExpiry = user.SubscriptionExpiry,
            ReferralCode = user.ReferralCode
        };

        return Ok(dto);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(User user)
    {
        var result = await _identityService.RegisterAsync(user);
        return HandleResult(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _identityService.LoginAsync(request.Username, request.PasswordHash);
        return HandleResult(result);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            UPDATE ""Users"" 
            SET ""ShopName"" = @ShopName, 
                ""Address"" = @Address, 
                ""GSTIN"" = @GSTIN, 
                ""LogoUrl"" = @LogoUrl,
                ""GstRates"" = @GstRates
            WHERE ""Id"" = @Id";
        
        await connection.ExecuteAsync(sql, user);
        return Ok(new { success = true });
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
}
