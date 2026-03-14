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
            @"SELECT COALESCE(SUM(""TotalAmount""), 0) FROM ""Bills"" 
              WHERE ""ShopOwnerId"" = @ShopOwnerId AND ""Status"" != 'CANCELLED'", new { shopOwnerId });
            
        var totalGST = await connection.ExecuteScalarAsync<decimal>(
            @"SELECT COALESCE(SUM(""TotalCGST"" + ""TotalSGST"" + ""TotalIGST""), 0) FROM ""Bills"" 
              WHERE ""ShopOwnerId"" = @ShopOwnerId AND ""Status"" != 'CANCELLED'", new { shopOwnerId });
            
        var totalInvoices = await connection.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM ""Bills"" 
              WHERE ""ShopOwnerId"" = @ShopOwnerId AND ""Status"" != 'CANCELLED'", new { shopOwnerId });

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
            WHERE b.""ShopOwnerId"" = @ShopOwnerId AND b.""Status"" != 'CANCELLED'
            GROUP BY ""ItemName""
            ORDER BY ""totalRevenue"" DESC
            LIMIT 5", new { shopOwnerId });

        var monthlySales = await connection.ExecuteScalarAsync<decimal>(@"
            SELECT COALESCE(SUM(""TotalAmount""), 0) 
            FROM ""Bills"" 
            WHERE ""ShopOwnerId"" = @ShopOwnerId 
            AND ""Status"" != 'CANCELLED'
            AND EXTRACT(MONTH FROM ""Date"") = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM ""Date"") = EXTRACT(YEAR FROM CURRENT_DATE)", new { shopOwnerId });

        var lowStockItems = await connection.QueryAsync<dynamic>(@"
            SELECT ""Name"", ""StockQuantity"", ""LowStockThreshold""
            FROM ""Items""
            WHERE ""ShopOwnerId"" = @ShopOwnerId 
            AND ""StockQuantity"" <= ""LowStockThreshold""
            ORDER BY ""StockQuantity"" ASC
            LIMIT 5", new { shopOwnerId });

        var totalCOGS = await connection.ExecuteScalarAsync<decimal>(
            @"SELECT COALESCE(SUM(bi.""Quantity"" * i.""PurchasePrice""), 0)
              FROM ""BillItems"" bi
              JOIN ""Bills"" b ON bi.""BillId"" = b.""Id""
              JOIN ""Items"" i ON bi.""ItemId"" = i.""Id""
              WHERE b.""ShopOwnerId"" = @ShopOwnerId AND b.""Status"" != 'CANCELLED'", new { shopOwnerId });

        var totalExpenses = await connection.ExecuteScalarAsync<decimal>(
            @"SELECT COALESCE(SUM(""Amount""), 0) FROM ""Expenses""
              WHERE ""ShopOwnerId"" = @ShopOwnerId", new { shopOwnerId });

        return Ok(new {
            TotalSales = totalSales,
            TotalCOGS = totalCOGS,
            TotalExpenses = totalExpenses,
            MonthlySales = monthlySales,
            TotalGST = totalGST,
            TotalInvoices = totalInvoices,
            TotalUdhaar = totalUdhaar,
            TopProducts = topProducts,
            LowStockItems = lowStockItems
        });
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Bill>> Get(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchBillNumber = null,
        [FromQuery] string? searchCustomer = null,
        [FromQuery] string? searchStatus = null)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var offset = (page - 1) * pageSize;
        
        var whereClause = @"WHERE b.""ShopOwnerId"" = @ShopOwnerId";
        
        if (!string.IsNullOrEmpty(searchBillNumber))
            whereClause += @" AND b.""BillNumber"" ILIKE @SearchBillNumber";
            
        if (!string.IsNullOrEmpty(searchCustomer))
            whereClause += @" AND (c.""Name"" ILIKE @SearchCustomer OR c.""Mobile"" ILIKE @SearchCustomer)";
            
        if (!string.IsNullOrEmpty(searchStatus))
            whereClause += @" AND b.""Status"" = @SearchStatus";
        
        var sql = $@"
            SELECT b.*, c.*
            FROM ""Bills"" b
            LEFT JOIN ""Customers"" c ON b.""CustomerId"" = c.""Id""
            {whereClause}
            ORDER BY b.""Date"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = $@"
            SELECT COUNT(*) 
            FROM ""Bills"" b
            LEFT JOIN ""Customers"" c ON b.""CustomerId"" = c.""Id""
            {whereClause}";

        var parameters = new { 
            ShopOwnerId = shopOwnerId, 
            Offset = offset, 
            Limit = pageSize,
            SearchBillNumber = $"%{searchBillNumber}%",
            SearchCustomer = $"%{searchCustomer}%",
            SearchStatus = searchStatus
        };

        var items = await connection.QueryAsync<Bill, Customer, Bill>(sql, (bill, customer) => {
            bill.Customer = customer;
            return bill;
        }, parameters, splitOn: "Id");
        
        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, parameters);

        return new BillingApp.Core.Models.PaginatedResult<Bill>(items, totalCount, page, pageSize);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var bill = await GetFullBillByIdInternal(id);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpGet("migrate-exchange")]
    [AllowAnonymous]
    public async Task<IActionResult> MigrateExchange()
    {
        try 
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("ALTER TABLE \"Bills\" ADD COLUMN IF NOT EXISTS \"OriginalBillId\" INTEGER NULL;");
            return Ok("Migration applied successfully.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
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
            
            var prefix = bill.OriginalBillId.HasValue ? "EX" : "";
            bill.BillNumber = $"{prefix}{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}";

            // 2. Insert Bill Header
            var billSql = @"
                INSERT INTO ""Bills"" (
                    ""BillNumber"", ""Date"", ""CustomerId"", ""SubTotal"", ""Discount"", 
                    ""TotalCGST"", ""TotalSGST"", ""TotalIGST"", ""TotalAmount"", ""PaymentMethod"", ""ShopOwnerId"", ""OriginalBillId""
                ) VALUES (
                    @BillNumber, @Date, @CustomerId, @SubTotal, @Discount, 
                    @TotalCGST, @TotalSGST, @TotalIGST, @TotalAmount, @PaymentMethod, @ShopOwnerId, @OriginalBillId
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

                // Inventory Management: Adjust Stock
                // For positive quantity (sale), stock decreases.
                // For negative quantity (return), stock increases automatically.
                var updateStockSql = @"
                    UPDATE ""Items"" 
                    SET ""StockQuantity"" = ""StockQuantity"" - @Quantity 
                    WHERE ""Id"" = @ItemId AND ""ShopOwnerId"" = @ShopOwnerId AND ""StockQuantity"" >= @Quantity";
                
                var stockAffected = await connection.ExecuteAsync(updateStockSql, 
                    new { Quantity = item.Quantity, ItemId = item.ItemId, ShopOwnerId = shopOwnerId }, transaction);
                
                if (stockAffected == 0)
                {
                     var currentStock = await connection.ExecuteScalarAsync<int?>(
                        @"SELECT ""StockQuantity"" FROM ""Items"" WHERE ""Id"" = @ItemId AND ""ShopOwnerId"" = @ShopOwnerId",
                        new { ItemId = item.ItemId, ShopOwnerId = shopOwnerId }, transaction);
                     
                     transaction.Rollback();
                     
                     if (currentStock == null) return BadRequest(new { message = $"Item with ID {item.ItemId} not found." });
                     
                     return BadRequest(new { message = $"Insufficient stock for item '{item.ItemName}'. Available: {currentStock}, Requested: {item.Quantity}" });
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

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            var bill = await connection.QuerySingleOrDefaultAsync<Bill>(
                "SELECT * FROM \"Bills\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @ShopOwnerId", 
                new { Id = id, ShopOwnerId = shopOwnerId }, transaction);

            if (bill == null) return NotFound("Invoice not found.");
            if (bill.Status == "CANCELLED") return BadRequest("Invoice is already cancelled.");

            // 1. Mark as cancelled
            await connection.ExecuteAsync(
                "UPDATE \"Bills\" SET \"Status\" = 'CANCELLED' WHERE \"Id\" = @Id", 
                new { Id = id }, transaction);

            // 2. Return stock
            var items = await connection.QueryAsync<BillItem>(
                "SELECT * FROM \"BillItems\" WHERE \"BillId\" = @Id", new { Id = id }, transaction);

            foreach (var item in items)
            {
                await connection.ExecuteAsync(
                    "UPDATE \"Items\" SET \"StockQuantity\" = \"StockQuantity\" + @Quantity WHERE \"Id\" = @ItemId AND \"ShopOwnerId\" = @ShopOwnerId",
                    new { Quantity = item.Quantity, ItemId = item.ItemId, ShopOwnerId = shopOwnerId }, transaction);
            }

            // 3. Reverse Ledger if it was a credit sale
            if (bill.PaymentMethod == "CREDIT")
            {
                var ledgerEntry = new CustomerLedger
                {
                    CustomerId = bill.CustomerId,
                    BillId = id,
                    Date = DateTime.UtcNow,
                    Type = "CREDIT", // Reversing a DEBIT with a CREDIT
                    Amount = bill.TotalAmount,
                    Description = $"Invoice Cancelled (Bill #{bill.BillNumber})",
                    ShopOwnerId = shopOwnerId
                };
                
                var ledgerSql = @"
                    INSERT INTO ""CustomerLedger"" (""CustomerId"", ""BillId"", ""Date"", ""Type"", ""Amount"", ""Description"", ""ShopOwnerId"") 
                    VALUES (@CustomerId, @BillId, @Date, @Type, @Amount, @Description, @ShopOwnerId)";
                
                await connection.ExecuteAsync(ledgerSql, ledgerEntry, transaction);
            }

            transaction.Commit();
            return Ok(new { Message = "Invoice cancelled successfully." });
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return StatusCode(500, $"Error cancelling invoice: {ex.Message}");
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
        // Determine the scheme (handle Nginx proxy using X-Forwarded-Proto, fallback to Request.Scheme)
        var scheme = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? Request.Scheme;
        
        // Force HTTPS if it's a known production domain to be safe
        if (Request.Host.Host.Contains("vinshri.in")) {
            scheme = "https";
        }
        
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
