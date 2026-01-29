namespace BillingApp.Core.Abstractions;

public interface IExportService
{
    Task<byte[]> GenerateSalesSummaryExcelAsync(int shopOwnerId, DateTime startDate, DateTime endDate);
    Task<byte[]> GenerateGstReportExcelAsync(int shopOwnerId, DateTime startDate, DateTime endDate);
}
