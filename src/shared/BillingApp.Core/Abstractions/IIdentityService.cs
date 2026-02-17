using BillingApp.Core.Entities;
using BillingApp.Core.Models;

namespace BillingApp.Core.Abstractions;

public interface IIdentityService
{
    Task<ApiResult<AuthResponse>> LoginAsync(string username, string password);
    Task<ApiResult<int>> RegisterAsync(User user);
    Task<ApiResult<bool>> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    string GenerateJwtToken(User user);
}
