using BillingApp.Core.Entities;
using BillingApp.Core.Models;
using System.Data;

namespace BillingApp.Core.Abstractions;

public interface ISubscriptionRepository
{
    Task<User?> GetUserAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null);
    Task<int> GetInvoiceCountAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null);
    
    Task<ActivationCode?> GetValidActivationCodeAsync(string code, IDbConnection? connection = null, IDbTransaction? transaction = null);
    Task UpdateUserSubscriptionAsync(int userId, string type, DateTime expiry, IDbConnection? connection = null, IDbTransaction? transaction = null);
    Task MarkCodeRedeemedAsync(int activationCodeId, int userId, DateTime redeemedAt, IDbConnection? connection = null, IDbTransaction? transaction = null);
    
    Task<string?> GetReferralCodeAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null);
    Task SetReferralCodeAsync(int userId, string code, IDbConnection? connection = null, IDbTransaction? transaction = null);
    
    Task<ActivationCode> CreateActivationCodeAsync(ActivationCode code, IDbConnection? connection = null, IDbTransaction? transaction = null);
    Task<IEnumerable<ActivationCode>> GetAllActivationCodesAsync(IDbConnection? connection = null, IDbTransaction? transaction = null);
    
    Task<IEnumerable<ReferralUser>> GetReferredUsersAsync(int userId, IDbConnection? connection = null, IDbTransaction? transaction = null);
}
