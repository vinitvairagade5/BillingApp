using BillingApp.Core.Abstractions;
using BillingApp.Core.Controllers;
using BillingApp.Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[Authorize]
public class LedgerController : BaseApiController
{
    private readonly ILedgerService _ledgerService;

    public LedgerController(ILedgerService ledgerService)
    {
        _ledgerService = ledgerService;
    }

    [HttpGet("balances")]
    public async Task<IActionResult> GetBalances()
    {
        var shopOwnerId = GetUserId();
        var result = await _ledgerService.GetAllBalancesAsync(shopOwnerId);
        return Ok(result);
    }

    [HttpGet("customer/{customerId}")]
    public async Task<IActionResult> GetCustomerLedger(int customerId)
    {
        var shopOwnerId = GetUserId();
        var history = await _ledgerService.GetCustomerHistoryAsync(customerId, shopOwnerId);
        var balance = await _ledgerService.GetCustomerBalanceAsync(customerId, shopOwnerId);
        
        return Ok(new { Balance = balance, History = history });
    }

    [HttpPost("manual-entry")]
    public async Task<IActionResult> AddManualEntry([FromBody] CustomerLedger entry)
    {
        var shopOwnerId = GetUserId();
        entry.ShopOwnerId = shopOwnerId;
        entry.Date = DateTime.UtcNow;
        
        var result = await _ledgerService.RecordTransactionAsync(entry);
        return HandleResult(result);
    }
}
