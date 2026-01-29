using BillingApp.Core.Abstractions;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using ClosedXML.Excel;
using Dapper;
using System.Data;

namespace BillingApp.Core.Services;

public class ExportService : IExportService
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ExportService(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<byte[]> GenerateSalesSummaryExcelAsync(int shopOwnerId, DateTime startDate, DateTime endDate)
    {
        using var connection = _connectionFactory.CreateConnection();
        // Updated query to include PaymentMethod
        var sql = @"
            SELECT b.*, c.""Name"" as CustomerName 
            FROM ""Bills"" b
            JOIN ""Customers"" c ON b.""CustomerId"" = c.""Id""
            WHERE b.""ShopOwnerId"" = @shopOwnerId 
            AND b.""Date"" >= @startDate AND b.""Date"" <= @endDate
            ORDER BY b.""Date"" DESC";
        
        var bills = await connection.QueryAsync<dynamic>(sql, new { shopOwnerId, startDate, endDate });

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Sales Summary");

        // Headers
        var headers = new[] { "Date", "Invoice #", "Customer", "Amount (₹)", "Payment Method" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.CoolGrey;
            cell.Style.Font.FontColor = XLColor.White;
        }

        int row = 2;
        decimal total = 0;
        foreach (var bill in bills)
        {
            worksheet.Cell(row, 1).Value = ((DateTime)bill.Date).ToString("dd-MMM-yyyy");
            worksheet.Cell(row, 2).Value = bill.BillNumber;
            worksheet.Cell(row, 3).Value = bill.CustomerName;
            worksheet.Cell(row, 4).Value = bill.TotalAmount;
            worksheet.Cell(row, 4).Style.NumberFormat.Format = "#,##0.00";
            worksheet.Cell(row, 5).Value = bill.PaymentMethod;
            
            total += (decimal)bill.TotalAmount;
            row++;
        }

        // Summary Row
        var totalLabelCell = worksheet.Cell(row, 3);
        totalLabelCell.Value = "TOTAL SALES";
        totalLabelCell.Style.Font.Bold = true;

        var totalValueCell = worksheet.Cell(row, 4);
        totalValueCell.Value = total;
        totalValueCell.Style.Font.Bold = true;
        totalValueCell.Style.NumberFormat.Format = "₹#,##0.00";
        totalValueCell.Style.Fill.BackgroundColor = XLColor.LightGreen;

        worksheet.Columns().AdjustToContents();
        
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> GenerateGstReportExcelAsync(int shopOwnerId, DateTime startDate, DateTime endDate)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = @"
            SELECT b.*, c.""Name"" as CustomerName 
            FROM ""Bills"" b
            JOIN ""Customers"" c ON b.""CustomerId"" = c.""Id""
            WHERE b.""ShopOwnerId"" = @shopOwnerId 
            AND b.""Date"" >= @startDate AND b.""Date"" <= @endDate
            ORDER BY b.""Date"" ASC";
        
        var bills = await connection.QueryAsync<dynamic>(sql, new { shopOwnerId, startDate, endDate });

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("GST Report");

        // Headers
        var headers = new[] { "Date", "Invoice #", "Customer", "Subtotal", "Discount", "CGST", "SGST", "IGST", "Grand Total" };
        for (int i = 0; i < headers.Length; i++)
        {
            var cell = worksheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.Navy;
            cell.Style.Font.FontColor = XLColor.White;
        }

        int row = 2;
        foreach (var bill in bills)
        {
            worksheet.Cell(row, 1).Value = ((DateTime)bill.Date).ToString("dd-MM-yyyy");
            worksheet.Cell(row, 2).Value = bill.BillNumber;
            worksheet.Cell(row, 3).Value = bill.CustomerName;
            worksheet.Cell(row, 4).Value = bill.SubTotal;
            worksheet.Cell(row, 5).Value = bill.Discount;
            worksheet.Cell(row, 6).Value = bill.TotalCGST;
            worksheet.Cell(row, 7).Value = bill.TotalSGST;
            worksheet.Cell(row, 8).Value = bill.TotalIGST;
            worksheet.Cell(row, 9).Value = bill.TotalAmount;
            
            // Format numbers
            for (int col = 4; col <= 9; col++)
                worksheet.Cell(row, col).Style.NumberFormat.Format = "#,##0.00";

            row++;
        }

        // Summary Totals
        worksheet.Cell(row, 3).Value = "TOTALS";
        worksheet.Cell(row, 3).Style.Font.Bold = true;
        for (int col = 4; col <= 9; col++)
        {
            var letter = worksheet.Cell(1, col).WorksheetColumn().ColumnLetter();
            worksheet.Cell(row, col).FormulaA1 = $"=SUM({letter}2:{letter}{row - 1})";
            worksheet.Cell(row, col).Style.Font.Bold = true;
            worksheet.Cell(row, col).Style.NumberFormat.Format = "#,##0.00";
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
