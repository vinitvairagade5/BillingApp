using System.Data;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;
using BillingApp.Core.Abstractions;

namespace BillingApp.API.Controllers;

[Authorize]
public class InvoiceController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly Services.IPdfService _pdfService;
    private readonly ISubscriptionService _subscriptionService;
    private readonly ILedgerService _ledgerService;

    public InvoiceController(IDbConnectionFactory connectionFactory, Services.IPdfService pdfService, ISubscriptionService subscriptionService, ILedgerService ledgerService)
    {
        _connectionFactory = connectionFactory;
        _pdfService = pdfService;
        _subscriptionService = subscriptionService;
        _ledgerService = ledgerService;
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
        var userId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var bill = await connection.QuerySingleOrDefaultAsync<Bill>(
            "SELECT * FROM \"Bills\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @UserId", 
            new { Id = id, UserId = userId });

        if (bill == null) return null;

        var items = await connection.QueryAsync<BillItem>(
            "SELECT * FROM \"BillItems\" WHERE \"BillId\" = @BillId", new { BillId = id });

        bill.Items = items.ToList();

        bill.ShopOwner = await connection.QuerySingleOrDefaultAsync<User>(
            "SELECT \"Id\", \"ShopName\", \"Username\", \"Address\", \"GSTIN\", \"LogoUrl\" FROM \"Users\" WHERE \"Id\" = @UserId", 
            new { UserId = userId });

        bill.Customer = await connection.QuerySingleOrDefaultAsync<Customer>(
             "SELECT * FROM \"Customers\" WHERE \"Id\" = @CustomerId", new { bill.CustomerId });

        return bill;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var totalSales = await connection.ExecuteScalarAsync<decimal>(
            "SELECT COALESCE(SUM(\"TotalAmount\"), 0) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { shopOwnerId });
            
        var totalGST = await connection.ExecuteScalarAsync<decimal>(
            "SELECT COALESCE(SUM(\"TotalCGST\" + \"TotalSGST\" + \"TotalIGST\"), 0) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { shopOwnerId });
            
        var totalInvoices = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", new { shopOwnerId });

        var totalUdhaar = await connection.ExecuteScalarAsync<decimal>(@"
            SELECT 
                COALESCE(SUM(CASE WHEN ""Type"" = 'DEBIT' THEN ""Amount"" ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN ""Type"" = 'CREDIT' THEN ""Amount"" ELSE 0 END), 0)
            FROM ""CustomerLedger""
            WHERE ""ShopOwnerId"" = @ShopOwnerId", new { shopOwnerId });

        var topProducts = await connection.QueryAsync<dynamic>(@"
            SELECT ""ItemName"" as ""name"", SUM(""Quantity"") as ""totalQuantity"", SUM(""Total"") as ""totalRevenue""
            FROM ""BillItems"" bi
            JOIN ""Bills"" b ON bi.""BillId"" = b.""Id""
            WHERE b.""ShopOwnerId"" = @ShopOwnerId
            GROUP BY ""ItemName""
            ORDER BY ""totalRevenue"" DESC
            LIMIT 5", new { shopOwnerId });

        var monthlySales = await connection.ExecuteScalarAsync<decimal>(@"
            SELECT COALESCE(SUM(""TotalAmount""), 0) 
            FROM ""Bills"" 
            WHERE ""ShopOwnerId"" = @ShopOwnerId 
            AND EXTRACT(MONTH FROM ""Date"") = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM ""Date"") = EXTRACT(YEAR FROM CURRENT_DATE)", new { shopOwnerId });

        var lowStockItems = await connection.QueryAsync<dynamic>(@"
            SELECT ""Name"", ""StockQuantity"", ""LowStockThreshold""
            FROM ""Items""
            WHERE ""ShopOwnerId"" = @ShopOwnerId 
            AND ""StockQuantity"" <= ""LowStockThreshold""
            ORDER BY ""StockQuantity"" ASC
            LIMIT 5", new { shopOwnerId });

        return Ok(new {
            TotalSales = totalSales,
            MonthlySales = monthlySales,
            TotalGST = totalGST,
            TotalInvoices = totalInvoices,
            TotalUdhaar = totalUdhaar,
            TopProducts = topProducts,
            LowStockItems = lowStockItems
        });
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Bill>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var offset = (page - 1) * pageSize;
        
        var sql = @"
            SELECT * FROM ""Bills"" 
            WHERE ""ShopOwnerId"" = @ShopOwnerId 
            ORDER BY ""Date"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = @"SELECT COUNT(*) FROM ""Bills"" WHERE ""ShopOwnerId"" = @ShopOwnerId";

        var items = await connection.QueryAsync<Bill>(sql, new { ShopOwnerId = shopOwnerId, Offset = offset, Limit = pageSize });
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { ShopOwnerId = shopOwnerId });

        return new BillingApp.Core.Models.PaginatedResult<Bill>(items, totalCount, page, pageSize);
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
        var shopOwnerId = GetUserId();
        
        // Phase 2 Gatekeeping: Check Limits
        var limitCheck = await _subscriptionService.CheckInvoiceLimitAsync(shopOwnerId);
        if (!limitCheck.Success)
            return BadRequest(limitCheck.Message);

        Console.WriteLine($"[DEBUG] Received Create Invitation for ShopOwnerId: {shopOwnerId}, CustomerId: {bill.CustomerId}");
        foreach(var item in bill.Items) {
            Console.WriteLine($"[DEBUG] Item: {item.ItemName}, Price: {item.Price}, Qty: {item.Quantity}");
        }

        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            bill.ShopOwnerId = shopOwnerId;
            // 1. Generate Bill Number
            var count = await connection.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM \"Bills\" WHERE \"ShopOwnerId\" = @ShopOwnerId", 
                new { bill.ShopOwnerId }, transaction);
            bill.BillNumber = $"{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}";

            // 2. Insert Bill Header
            var billSql = @"
                INSERT INTO ""Bills"" (
                    ""BillNumber"", ""Date"", ""CustomerId"", ""SubTotal"", ""Discount"", 
                    ""TotalCGST"", ""TotalSGST"", ""TotalIGST"", ""TotalAmount"", ""PaymentMethod"", ""ShopOwnerId""
                ) VALUES (
                    @BillNumber, @Date, @CustomerId, @SubTotal, @Discount, 
                    @TotalCGST, @TotalSGST, @TotalIGST, @TotalAmount, @PaymentMethod, @ShopOwnerId
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

                // Inventory Management: Deduct Stock
                // We check existing stock first to ensure data integrity or raise error
                // Option: Allow negative stock but warn? Or strict block?
                // Let's implement strict block for now as per plan logic "Deduct stock". 
                // Using atomic update for safety: "Update Items Set Stock = Stock - Qty Where Id = @Id AND Stock >= Qty"
                // If row count is 0, it means insufficient stock (concurrently or just invalid).
                
                var updateStockSql = @"
                    UPDATE ""Items"" 
                    SET ""StockQuantity"" = ""StockQuantity"" - @Quantity 
                    WHERE ""Id"" = @ItemId AND ""ShopOwnerId"" = @ShopOwnerId AND ""StockQuantity"" >= @Quantity";
                
                // We need ShopOwnerId here, which is in bill.ShopOwnerId
                var stockAffected = await connection.ExecuteAsync(updateStockSql, 
                    new { Quantity = item.Quantity, ItemId = item.ItemId, ShopOwnerId = shopOwnerId }, transaction);
                
                if (stockAffected == 0)
                {
                     // Check if item exists to give better error
                     var currentStock = await connection.ExecuteScalarAsync<int?>(
                        @"SELECT ""StockQuantity"" FROM ""Items"" WHERE ""Id"" = @ItemId AND ""ShopOwnerId"" = @ShopOwnerId",
                        new { ItemId = item.ItemId, ShopOwnerId = shopOwnerId }, transaction);
                     
                     if (currentStock == null) throw new Exception($"Item with ID {item.ItemId} not found.");
                     
                     // If we are here, stock was insufficient
                     throw new Exception($"Insufficient stock for item '{item.ItemName}'. Available: {currentStock}, Requested: {item.Quantity}");
                }
            }

            // Phase 3: Automatic Ledger entry for Udhaar
            if (bill.PaymentMethod == "CREDIT")
            {
                var ledgerEntry = new CustomerLedger
                {
                    CustomerId = bill.CustomerId,
                    BillId = billId,
                    Date = bill.Date,
                    Type = "DEBIT",
                    Amount = bill.TotalAmount,
                    Description = $"Credit sale (Bill #{bill.BillNumber})",
                    ShopOwnerId = shopOwnerId
                };
                
                var ledgerSql = @"
                    INSERT INTO ""CustomerLedger"" (""CustomerId"", ""BillId"", ""Date"", ""Type"", ""Amount"", ""Description"", ""ShopOwnerId"") 
                    VALUES (@CustomerId, @BillId, @Date, @Type, @Amount, @Description, @ShopOwnerId)";
                
                await connection.ExecuteAsync(ledgerSql, ledgerEntry, transaction);
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
    public async Task<IEnumerable<Customer>> SearchCustomers(string query)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = "SELECT * FROM \"Customers\" WHERE \"ShopOwnerId\" = @ShopOwnerId AND (\"Name\" ILIKE @Query OR \"Mobile\" ILIKE @Query) LIMIT 10";
        return await connection.QueryAsync<Customer>(sql, new { ShopOwnerId = shopOwnerId, Query = $"%{query}%" });
    }

    [HttpGet("items/search")]
    public async Task<IEnumerable<Item>> SearchItems(string query)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var sql = "SELECT * FROM \"Items\" WHERE \"ShopOwnerId\" = @ShopOwnerId AND \"Name\" ILIKE @Query LIMIT 10";
        return await connection.QueryAsync<Item>(sql, new { ShopOwnerId = shopOwnerId, Query = $"%{query}%" });
    }
}
