using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BillingApp.Core.Abstractions;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BillingApp.Core.Services;

public class IdentityService : IIdentityService
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IConfiguration _configuration;

    public IdentityService(IDbConnectionFactory connectionFactory, IConfiguration configuration)
    {
        _connectionFactory = connectionFactory;
        _configuration = configuration;
    }

    public async Task<ApiResult<AuthResponse>> LoginAsync(string username, string password)
    {
        using var connection = _connectionFactory.CreateConnection();
        var user = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM \"Users\" WHERE \"Username\" = @Username AND \"PasswordHash\" = @PasswordHash", 
            new { Username = username, PasswordHash = password });

        if (user == null) 
            return ApiResult<AuthResponse>.Failure("Invalid credentials.");

        var token = GenerateJwtToken(user);
        
        return ApiResult<AuthResponse>.Ok(new AuthResponse
        {
            Token = token,
            Expiry = DateTime.UtcNow.AddDays(7),
            User = new UserDto { Id = user.Id, Username = user.Username, ShopName = user.ShopName }
        });
    }

    public async Task<ApiResult<int>> RegisterAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        var exists = await connection.ExecuteScalarAsync<bool>(
            "SELECT EXISTS(SELECT 1 FROM \"Users\" WHERE \"Username\" = @Username)", new { user.Username });
        
        if (exists) return ApiResult<int>.Failure("Username already taken.");

        var sql = @"
            INSERT INTO ""Users"" (""Username"", ""PasswordHash"", ""ShopName"") 
            VALUES (@Username, @PasswordHash, @ShopName) 
            RETURNING ""Id""";
        
        var userId = await connection.ExecuteScalarAsync<int>(sql, user);
        return ApiResult<int>.Ok(userId);
    }

    public string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"] ?? "SuperSecretKeyForDevelopmentPurposes123!"; // Fallback for dev
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("ShopName", user.ShopName)
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"] ?? "BillingApp",
            audience: jwtSettings["Audience"] ?? "BillingAppUser",
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
