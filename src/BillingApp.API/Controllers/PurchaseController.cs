using System.Data;
using BillingApp.Core.Data;
using BillingApp.Core.Entities;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BillingApp.Core.Controllers;

namespace BillingApp.API.Controllers;

[Authorize]
public class PurchaseController : BaseApiController
{
    private readonly IDbConnectionFactory _connectionFactory;

    public PurchaseController(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    [HttpGet]
    public async Task<BillingApp.Core.Models.PaginatedResult<Purchase>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        var offset = (page - 1) * pageSize;
        
        var sql = @"
            SELECT p.*, s.""Id"", s.""Name"" as ""Name""
            FROM ""Purchases"" p
            LEFT JOIN ""Suppliers"" s ON p.""SupplierId"" = s.""Id""
            WHERE p.""ShopOwnerId"" = @ShopOwnerId 
            ORDER BY p.""Date"" DESC 
            OFFSET @Offset LIMIT @Limit";

        var countSql = @"SELECT COUNT(*) FROM ""Purchases"" WHERE ""ShopOwnerId"" = @ShopOwnerId";

        var purchasesMap = new Dictionary<int, Purchase>();

        var purchases = await connection.QueryAsync<Purchase, Supplier, Purchase>(
            sql,
            (purchase, supplier) => {
                if (!purchasesMap.TryGetValue(purchase.Id, out var currentPurchase))
                {
                    currentPurchase = purchase;
                    currentPurchase.Items = new List<PurchaseItem>();
                    purchasesMap.Add(currentPurchase.Id, currentPurchase);
                }
                currentPurchase.Supplier = supplier;
                return currentPurchase;
            },
            new { ShopOwnerId = shopOwnerId, Offset = offset, Limit = pageSize },
            splitOn: "Id");

        var distinctPurchases = purchasesMap.Values.ToList();

        if (distinctPurchases.Any())
        {
            var purchaseIds = distinctPurchases.Select(p => p.Id).ToList();
            var itemsSql = @"SELECT * FROM ""PurchaseItems"" WHERE ""PurchaseId"" = ANY(@Ids)";
            var allItems = await connection.QueryAsync<PurchaseItem>(itemsSql, new { Ids = purchaseIds });
            
            foreach (var item in allItems)
            {
                if (purchasesMap.TryGetValue(item.PurchaseId, out var p))
                {
                    p.Items.Add(item);
                }
            }
        }

        var totalCount = await connection.ExecuteScalarAsync<int>(countSql, new { ShopOwnerId = shopOwnerId });

        return new BillingApp.Core.Models.PaginatedResult<Purchase>(distinctPurchases, totalCount, page, pageSize);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var shopOwnerId = GetUserId();
        using var connection = _connectionFactory.CreateConnection();
        
        var purchase = await connection.QuerySingleOrDefaultAsync<Purchase>(
            "SELECT * FROM \"Purchases\" WHERE \"Id\" = @Id AND \"ShopOwnerId\" = @ShopOwnerId", 
            new { Id = id, ShopOwnerId = shopOwnerId });

        if (purchase == null) return NotFound();

        purchase.Items = (await connection.QueryAsync<PurchaseItem>(
            "SELECT * FROM \"PurchaseItems\" WHERE \"PurchaseId\" = @PurchaseId", new { PurchaseId = id })).ToList();

        purchase.Supplier = await connection.QuerySingleOrDefaultAsync<Supplier>(
            "SELECT * FROM \"Suppliers\" WHERE \"Id\" = @SupplierId", new { SupplierId = purchase.SupplierId });

        return Ok(purchase);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Purchase purchase)
    {
        var shopOwnerId = GetUserId();
        
        using var connection = _connectionFactory.CreateConnection();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            purchase.ShopOwnerId = shopOwnerId;
            
            // Generate Invoice No if missing
            if (string.IsNullOrWhiteSpace(purchase.InvoiceNo)) 
            {
                var count = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM \"Purchases\" WHERE \"ShopOwnerId\" = @ShopOwnerId", 
                    new { ShopOwnerId = shopOwnerId }, transaction);
                purchase.InvoiceNo = $"PUR-{DateTime.UtcNow:yyyyMMdd}-{count + 1:D4}";
            }

            var purchaseSql = @"
                INSERT INTO ""Purchases"" (""InvoiceNo"", ""Date"", ""SupplierId"", ""TotalAmount"", ""PaymentStatus"", ""ShopOwnerId"")
                VALUES (@InvoiceNo, @Date, @SupplierId, @TotalAmount, @PaymentStatus, @ShopOwnerId)
                RETURNING ""Id""";

            var purchaseId = await connection.ExecuteScalarAsync<int>(purchaseSql, purchase, transaction);

            var itemSql = @"
                INSERT INTO ""PurchaseItems"" (""PurchaseId"", ""ItemId"", ""Quantity"", ""PurchasePrice"", ""Total"")
                VALUES (@PurchaseId, @ItemId, @Quantity, @PurchasePrice, @Total)";

            foreach (var item in purchase.Items)
            {
                item.PurchaseId = purchaseId;
                await connection.ExecuteAsync(itemSql, item, transaction);

                // Inventory Inward: MUST increase StockQuantity and optionally update latest PurchasePrice
                var updateStockSql = @"
                    UPDATE ""Items"" 
                    SET ""StockQuantity"" = ""StockQuantity"" + @Quantity,
                        ""PurchasePrice"" = @PurchasePrice
                    WHERE ""Id"" = @ItemId AND ""ShopOwnerId"" = @ShopOwnerId";
                
                await connection.ExecuteAsync(updateStockSql, 
                    new { Quantity = item.Quantity, PurchasePrice = item.PurchasePrice, ItemId = item.ItemId, ShopOwnerId = shopOwnerId }, transaction);
            }

            transaction.Commit();
            return Ok(new { Id = purchaseId, InvoiceNo = purchase.InvoiceNo });
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return StatusCode(500, $"Error creating purchase record: {ex.Message}");
        }
    }
}
