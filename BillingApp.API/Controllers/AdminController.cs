using BillingApp.Core.Abstractions;
using BillingApp.Core.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[Authorize]
public class AdminController : BaseApiController
{
    private readonly ISubscriptionService _subscriptionService;

    public AdminController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpPost("generate-codes")]
    public async Task<IActionResult> GenerateCodes([FromBody] GenerateCodesRequest request)
    {
        if (!IsAdmin())
            return StatusCode(403, "Admin access required.");

        var result = await _subscriptionService.GenerateActivationCodesAsync(request.Count, request.DurationDays);
        return HandleResult(result);
    }

    [HttpGet("codes")]
    public async Task<IActionResult> GetAllCodes()
    {
        if (!IsAdmin())
            return StatusCode(403, "Admin access required.");

        var result = await _subscriptionService.GetAllActivationCodesAsync();
        return Ok(result);
    }
}

public class GenerateCodesRequest
{
    public int Count { get; set; } = 1;
    public int DurationDays { get; set; } = 365;
}
