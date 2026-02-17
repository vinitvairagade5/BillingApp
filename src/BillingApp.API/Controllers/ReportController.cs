using BillingApp.Core.Abstractions;
using BillingApp.Core.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[Authorize]
public class ReportController : BaseApiController
{
    private readonly IExportService _exportService;

    public ReportController(IExportService exportService)
    {
        _exportService = exportService;
    }

    [HttpGet("sales-summary")]
    public async Task<IActionResult> DownloadSalesSummary([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var shopOwnerId = GetUserId();
        var bytes = await _exportService.GenerateSalesSummaryExcelAsync(shopOwnerId, start, end);
        var fileName = $"Sales_Summary_{start:ddMMyy}_{end:ddMMyy}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    [HttpGet("gst-report")]
    public async Task<IActionResult> DownloadGstReport([FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var shopOwnerId = GetUserId();
        var bytes = await _exportService.GenerateGstReportExcelAsync(shopOwnerId, start, end);
        var fileName = $"GST_Report_{start:ddMMyy}_{end:ddMMyy}.xlsx";
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
