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
            User = new UserDto 
            { 
                Id = user.Id, 
                Username = user.Username, 
                ShopName = user.ShopName, 
                IsAdmin = user.IsAdmin,
                SubscriptionType = user.SubscriptionType,
                SubscriptionExpiry = user.SubscriptionExpiry,
                ReferralCode = user.ReferralCode
            }
        });
    }

    public async Task<ApiResult<int>> RegisterAsync(User user)
    {
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            var exists = await connection.ExecuteScalarAsync<bool>(
                "SELECT EXISTS(SELECT 1 FROM \"Users\" WHERE \"Username\" = @Username)", 
                new { user.Username }, transaction);
            
            if (exists) return ApiResult<int>.Failure("Username already taken.");

            // 1. Handle Referral Code (if provided in the request or temporary field)
            // Note: We use the existing user.ReferralCode field from the request to check for the INVITER'S code
            string? inputReferralCode = user.ReferralCode; 
            
            if (!string.IsNullOrEmpty(inputReferralCode))
            {
                var inviter = await connection.QuerySingleOrDefaultAsync<User>(
                    "SELECT \"Id\", \"SubscriptionExpiry\" FROM \"Users\" WHERE \"ReferralCode\" = @inputReferralCode",
                    new { inputReferralCode }, transaction);

                if (inviter != null)
                {
                    user.ReferredById = inviter.Id;
                    user.SubscriptionType = "PRO";
                    user.SubscriptionExpiry = DateTime.UtcNow.AddDays(7);

                    // Reward Inviter: Add 7 days to their current expiry or from now
                    DateTime inviterCurrentExpiry = inviter.SubscriptionExpiry ?? DateTime.UtcNow;
                    if (inviterCurrentExpiry < DateTime.UtcNow) inviterCurrentExpiry = DateTime.UtcNow;
                    DateTime newInviterExpiry = inviterCurrentExpiry.AddDays(7);

                    await connection.ExecuteAsync(
                        "UPDATE \"Users\" SET \"SubscriptionType\" = 'PRO', \"SubscriptionExpiry\" = @newInviterExpiry WHERE \"Id\" = @Id",
                        new { newInviterExpiry, Id = inviter.Id }, transaction);
                }
            }

            // 2. Generate their OWN referral code for future invites
            user.ReferralCode = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();

            var sql = @"
                INSERT INTO ""Users"" (""Username"", ""PasswordHash"", ""ShopName"", ""ReferralCode"", ""ReferredById"", ""SubscriptionType"", ""SubscriptionExpiry"") 
                VALUES (@Username, @PasswordHash, @ShopName, @ReferralCode, @ReferredById, @SubscriptionType, @SubscriptionExpiry) 
                RETURNING ""Id""";
            
            var userId = await connection.ExecuteScalarAsync<int>(sql, user, transaction);
            transaction.Commit();
            return ApiResult<int>.Ok(userId);
        }
        catch (Exception)
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<ApiResult<bool>> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        using var connection = _connectionFactory.CreateConnection();
        
        // 1. Verify Current Password
        var user = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM \"Users\" WHERE \"Id\" = @userId", 
            new { userId });

        if (user == null) return ApiResult<bool>.Failure("User not found.");

        // Note: Currently using plain checks as per existing Login flow. 
        // In verify future, this should use proper hashing.
        if (user.PasswordHash != currentPassword)
        {
            return ApiResult<bool>.Failure("Incorrect current password.");
        }

        // 2. Update Password
        await connection.ExecuteAsync(
            "UPDATE \"Users\" SET \"PasswordHash\" = @newPassword WHERE \"Id\" = @userId",
            new { newPassword, userId });

        return ApiResult<bool>.Ok(true);
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
            new Claim("ShopName", user.ShopName),
            new Claim("IsAdmin", user.IsAdmin.ToString())
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
