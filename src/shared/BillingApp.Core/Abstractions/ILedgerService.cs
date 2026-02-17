using BillingApp.Core.Entities;
using BillingApp.Core.Models;

namespace BillingApp.Core.Abstractions;

public interface ILedgerService
{
    Task<ApiResult<bool>> RecordTransactionAsync(CustomerLedger entry);
    Task<decimal> GetCustomerBalanceAsync(int customerId, int shopOwnerId);
    Task<IEnumerable<CustomerLedger>> GetCustomerHistoryAsync(int customerId, int shopOwnerId);
    Task<IEnumerable<CustomerBalanceDto>> GetAllBalancesAsync(int shopOwnerId);
}
