using BillingApp.Core.Abstractions;
using BillingApp.Core.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[Authorize]
public class SubscriptionController : BaseApiController
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpPost("redeem")]
    public async Task<IActionResult> Redeem([FromBody] string code)
    {
        var userId = GetUserId();
        var result = await _subscriptionService.RedeemCodeAsync(userId, code);
        return HandleResult(result);
    }

    [HttpGet("referral-code")]
    public async Task<IActionResult> GetReferralCode()
    {
        var userId = GetUserId();
        var code = await _subscriptionService.EnsureReferralCodeAsync(userId);
        return Ok(new { Code = code });
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var userId = GetUserId();
        var isPro = await _subscriptionService.IsProAsync(userId);
        return Ok(new { IsPro = isPro });
    }

    [HttpGet("referral-stats")]
    public async Task<IActionResult> GetReferralStats()
    {
        var userId = GetUserId();
        var stats = await _subscriptionService.GetReferralStatsAsync(userId);
        return Ok(stats);
    }
}
