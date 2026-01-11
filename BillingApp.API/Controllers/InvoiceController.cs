using System.Data;
using BillingApp.API.Data;
using BillingApp.API.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoiceController : ControllerBase
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly Services.IPdfService _pdfService;

    public InvoiceController(IDbConnectionFactory connectionFactory, Services.IPdfService pdfService)
    {
        _connectionFactory = connectionFactory;
        _pdfService = pdfService;
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var bill = await GetFullBillByIdInternal(id);
        if (bill == null) return NotFound();

        var pdfBytes = _pdfService.GenerateInvoicePdf(bill);
        return File(pdfBytes, "application/pdf", $"Invoice-{bill.BillNumber}.pdf");
    }

    private async Task<Bill?> GetFullBillByIdInternal(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var bill = await connection.QuerySingleOrDefaultAsync<Bill>(
            "SELECT * FROM \"Bills\" WHERE \"Id\" = @Id", new { Id = id });

        if (bill == null) return null;

        var items = await connection.QueryAsync<BillItem>(
            "SELECT * FROM \"BillItems\" WHERE \"BillId\" = @BillId", new { BillId = id });

        bill.Items = items.ToList();

        bill.ShopOwner = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT \"Id\", \"ShopName\", \"Username\", \"Address\", \"GSTIN\", \"LogoUrl\" FROM \"Users\" WHERE \"Id\" = @ShopOwnerId", new { bill.ShopOwnerId });

        bill.Customer = await connection.QuerySingleOrDefaultAsync<Customer>(
             "SELECT * FROM \"Customers\" WHERE \"Id\" = @CustomerId", new { bill.CustomerId });

        return bill;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats(int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        
        var totalSales = await connection.ExecuteScalarAsync<decimal>(
            "SELECT COALESCE(SUM(\"TotalAmount\"), 0) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { shopOwnerId });
            
        var totalGST = await connection.ExecuteScalarAsync<decimal>(
            "SELECT COALESCE(SUM(\"TotalCGST\" + \"TotalSGST\" + \"TotalIGST\"), 0) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { shopOwnerId });
            
        var totalInvoices = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { shopOwnerId });

        var topProducts = await connection.QueryAsync<dynamic>(@"
            SELECT ""ItemName"" as Name, SUM(""Quantity"") as TotalQuantity, SUM(""Total"") as TotalRevenue
            FROM ""BillItems"" bi
            JOIN ""Bills"" b ON bi.""BillId"" = b.""Id""
            WHERE b.""ShopOwnerId"" = @ShopOwnerId
            GROUP BY ""ItemName""
            ORDER BY TotalRevenue DESC
            LIMIT 5", new { shopOwnerId });

        return Ok(new {
            TotalSales = totalSales,
            TotalGST = totalGST,
            TotalInvoices = totalInvoices,
            TopProducts = topProducts
        });
    }

    [HttpGet]
    public async Task<IEnumerable<Bill>> Get(int shopOwnerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = "SELECT * FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId ORDER BY \"Date\" DESC";
        return await connection.QueryAsync<Bill>(sql, new { ShopOwnerId = shopOwnerId });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var bill = await GetFullBillByIdInternal(id);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Bill bill)
    {
        Console.WriteLine($"[DEBUG] Received Create Invitation for ShopOwnerId: {bill.ShopOwnerId}, CustomerId: {bill.CustomerId}");
        foreach(var item in bill.Items) {
            Console.WriteLine($"[DEBUG] Item: {item.ItemName}, Price: {item.Price}, Qty: {item.Quantity}");
        }

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            // 1. Generate Bill Number
            var count = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", 
                new { bill.ShopOwnerId }, transaction);
            bill.BillNumber = $"{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}";

            // 2. Insert Bill Header
            var billSql = @"
                INSERT INTO ""Bills"" (
                    ""BillNumber"", ""Date"", ""CustomerId"", ""SubTotal"", ""Discount"", 
                    ""TotalCGST"", ""TotalSGST"", ""TotalIGST"", ""TotalAmount"", ""ShopOwnerId""
                ) VALUES (
                    @BillNumber, @Date, @CustomerId, @SubTotal, @Discount, 
                    @TotalCGST, @TotalSGST, @TotalIGST, @TotalAmount, @ShopOwnerId
                ) RETURNING ""Id""";

            var billId = await connection.ExecuteScalarAsync<int>(billSql, bill, transaction);

            // 3. Insert Bill Items
            var itemSql = @"
                INSERT INTO ""BillItems"" (
                    ""BillId"", ""ItemId"", ""ItemName"", ""Price"", ""Quantity"", 
                    ""Discount"", ""HSNCode"", ""CGST"", ""SGST"", ""IGST"", ""Total""
                ) VALUES (
                    @BillId, @ItemId, @ItemName, @Price, @Quantity, 
                    @Discount, @HSNCode, @CGST, @SGST, @IGST, @Total
                )";

            foreach (var item in bill.Items)
            {
                item.BillId = billId;
                await connection.ExecuteAsync(itemSql, item, transaction);
            }

            transaction.Commit();
            return Ok(new { Id = billId, BillNumber = bill.BillNumber });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] Invoice Creation Failed: {ex.Message}");
            if (ex.InnerException != null) Console.WriteLine($"[INNER ERROR] {ex.InnerException.Message}");
            transaction.Rollback();
            return StatusCode(500, $"Error creating invoice: {ex.Message}");
        }
    }
    [HttpGet("{id}/whatsapp")]
    public async Task<IActionResult> GetWhatsappUrl(int id)
    {
        using var connection = _connectionFactory.CreateConnection();
        var bill = await connection.QuerySingleOrDefaultAsync<Bill>(
            "SELECT * FROM \"Bills\" WHERE \"Id\" = @Id", new { Id = id });

        if (bill == null) return NotFound("Bill not found.");

        var customer = await connection.QuerySingleOrDefaultAsync<Customer>(
             "SELECT * FROM \"Customers\" WHERE \"Id\" = @CustomerId", new { bill.CustomerId });

        var shopOwner = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT \"ShopName\" FROM \"Users\" WHERE \"Id\" = @ShopOwnerId", new { bill.ShopOwnerId });

        if (customer == null || string.IsNullOrEmpty(customer.Mobile))
        {
            return BadRequest("Customer mobile number not found.");
        }

        // Format message
        // Dynamically determine the host (IP or Domain) from the current request
        var scheme = Request.Scheme;
        var host = Request.Host;
        var pdfLink = $"{scheme}://{host}/api/Invoice/{id}/pdf";
        var message = $"Hello {customer.Name},\n\nInvoice #{bill.BillNumber} for ₹{bill.TotalAmount:N2} is generated.\n\nClick to Download PDF:\n{pdfLink}\n\nThank you for shopping with {shopOwner?.ShopName ?? "us"}.";
        var encodedMessage = System.Net.WebUtility.UrlEncode(message);
        
        // Simple mobile number formatting (Assuming India)
        var mobile = customer.Mobile.Trim();
        // Remove non-digit chars
        var digitsOnly = new string(mobile.Where(char.IsDigit).ToArray());
        
        if (digitsOnly.Length == 10)
        {
            digitsOnly = "91" + digitsOnly;
        }
        
        var url = $"https://wa.me/{digitsOnly}?text={encodedMessage}";
        
        return Ok(new { Url = url });
    }

    [HttpGet("customers/search")]
    public async Task<IEnumerable<Customer>> SearchCustomers(int shopOwnerId, string query)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = "SELECT * FROM \"Customers\" WHERE \"ShopOwnerId\" = @ShopOwnerId AND (\"Name\" ILIKE @Query OR \"Mobile\" ILIKE @Query) LIMIT 10";
        return await connection.QueryAsync<Customer>(sql, new { ShopOwnerId = shopOwnerId, Query = $"%{query}%" });
    }

    [HttpGet("items/search")]
    public async Task<IEnumerable<Item>> SearchItems(int shopOwnerId, string query)
    {
        using var connection = _connectionFactory.CreateConnection();
        var sql = "SELECT * FROM \"Items\" WHERE \"ShopOwnerId\" = @ShopOwnerId AND \"Name\" ILIKE @Query LIMIT 10";
        return await connection.QueryAsync<Item>(sql, new { ShopOwnerId = shopOwnerId, Query = $"%{query}%" });
    }
}
