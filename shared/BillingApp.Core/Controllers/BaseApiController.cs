using BillingApp.Core.Models;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.Core.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected IActionResult HandleResult<T>(ApiResult<T> result)
    {
        if (result.Success)
            return Ok(result);
        
        return BadRequest(result);
    }

    protected int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return claim != null ? int.Parse(claim.Value) : 0;
    }

    protected bool IsAdmin()
    {
        var claim = User.FindFirst("IsAdmin");
        return claim != null && bool.Parse(claim.Value);
    }
}
