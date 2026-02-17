using BillingApp.Core.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BillingApp.API.Services;

public class PdfService : IPdfService
{
    public PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateInvoicePdf(Bill bill)
    {
        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily("Arial"));

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);
                page.Footer().Element(ComposeFooter);
            });
        }).GeneratePdf();

        void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text(bill.ShopOwner?.ShopName?.ToUpper() ?? "YOUR BUSINESS")
                        .FontSize(20).Bold().FontColor(Colors.Black);

                    column.Item().PaddingTop(5).Column(col => {
                        if (!string.IsNullOrEmpty(bill.ShopOwner?.Address))
                            col.Item().Text(bill.ShopOwner.Address).FontSize(10).FontColor(Colors.Black);
                        
                        if (!string.IsNullOrEmpty(bill.ShopOwner?.GSTIN))
                             col.Item().Text($"GSTIN: {bill.ShopOwner.GSTIN}").FontSize(10).SemiBold();
                    });
                });

                row.ConstantItem(180).Column(column =>
                {
                    column.Item().AlignRight().Text("TAX INVOICE")
                        .FontSize(16).SemiBold().FontColor(Colors.Black);
                    
                    column.Item().PaddingTop(10).AlignRight().Text(text =>
                    {
                        text.Span("Invoice #: ").FontSize(10).FontColor(Colors.Black);
                        text.Span(bill.BillNumber).FontSize(10).SemiBold();
                    });

                    column.Item().AlignRight().Text(text =>
                    {
                        text.Span("Date: ").FontSize(10).FontColor(Colors.Black);
                        text.Span($"{bill.Date:dd MMM yyyy}").FontSize(10).SemiBold();
                    });
                });
            });
        }

        void ComposeContent(IContainer container)
        {
            container.PaddingVertical(20).Column(column =>
            {
                column.Item().PaddingBottom(20).Container().Border(1).BorderColor(Colors.Black).Padding(15).Column(col =>
                {
                    col.Item().Text("BILLED TO").FontSize(8).FontColor(Colors.Black).SemiBold();
                    col.Item().Text(bill.Customer?.Name ?? "Walk-in Customer").FontSize(12).Bold();
                    if (!string.IsNullOrEmpty(bill.Customer?.Mobile))
                        col.Item().Text(bill.Customer.Mobile).FontSize(10);
                    if (!string.IsNullOrEmpty(bill.Customer?.Address))
                        col.Item().Text(bill.Customer.Address).FontSize(10);
                });

                column.Item().Element(ComposeTable);
                
                column.Item().PaddingTop(20).Row(row => 
                {
                    row.RelativeItem();
                    row.ConstantItem(250).Column(col => 
                    {
                        col.Item().Table(table => 
                        {
                            table.ColumnsDefinition(c => 
                            { 
                                c.RelativeColumn(); 
                                c.RelativeColumn(); 
                            });

                            table.Cell().PaddingBottom(5).Text("Subtotal").FontColor(Colors.Black);
                            table.Cell().AlignRight().PaddingBottom(5).Text($"{bill.SubTotal:N2}");

                            if (bill.TotalCGST > 0)
                            {
                                var cgstPercent = bill.SubTotal > 0 ? (bill.TotalCGST / bill.SubTotal) * 100 : 0;
                                table.Cell().PaddingBottom(5).Text($"CGST ({cgstPercent:0.#}%)").FontColor(Colors.Black);
                                table.Cell().AlignRight().PaddingBottom(5).Text($"{bill.TotalCGST:N2}");
                            }
                            if (bill.TotalSGST > 0)
                            {
                                var sgstPercent = bill.SubTotal > 0 ? (bill.TotalSGST / bill.SubTotal) * 100 : 0;
                                table.Cell().PaddingBottom(5).Text($"SGST ({sgstPercent:0.#}%)").FontColor(Colors.Black);
                                table.Cell().AlignRight().PaddingBottom(5).Text($"{bill.TotalSGST:N2}");
                            }
                            if (bill.TotalIGST > 0)
                            {
                                var igstPercent = bill.SubTotal > 0 ? (bill.TotalIGST / bill.SubTotal) * 100 : 0;
                                table.Cell().PaddingBottom(5).Text($"IGST ({igstPercent:0.#}%)").FontColor(Colors.Black);
                                table.Cell().AlignRight().PaddingBottom(5).Text($"{bill.TotalIGST:N2}");
                            }

                            table.Cell().ColumnSpan(2).PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Black);

                            table.Cell().Text("TOTAL").FontSize(14).Bold();
                            table.Cell().AlignRight().Text($"INR {bill.TotalAmount:N2}").FontSize(14).Bold();
                            
                            table.Cell().ColumnSpan(2).AlignRight().Text("(Inclusive of all taxes)").FontSize(8).FontColor(Colors.Black);
                        });
                    });
                });
                
                column.Item().PaddingTop(30).Column(col => {
                    col.Item().Text("TERMS & CONDITIONS").FontSize(10).SemiBold();
                    col.Item().PaddingTop(5).Text("1. Goods once sold will not be taken back.").FontSize(9).FontColor(Colors.Black);
                    col.Item().Text("2. Interest at 18% p.a. will be charged if not paid by due date.").FontSize(9).FontColor(Colors.Black);
                });
            });
        }

        void ComposeTable(IContainer container)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(30);
                    columns.RelativeColumn(4);
                    columns.ConstantColumn(60);
                    columns.RelativeColumn(2);
                    columns.ConstantColumn(50);
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(2);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).Text("#");
                    header.Cell().Element(HeaderStyle).Text("ITEM DESCRIPTION");
                    header.Cell().Element(HeaderStyle).AlignCenter().Text("HSN");
                    header.Cell().Element(HeaderStyle).AlignCenter().Text("PRICE");
                    header.Cell().Element(HeaderStyle).AlignCenter().Text("QTY");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("GST");
                    header.Cell().Element(HeaderStyle).AlignRight().Text("TOTAL");

                    static IContainer HeaderStyle(IContainer container) => container
                        .BorderBottom(1).BorderColor(Colors.Black)
                        .PaddingVertical(8)
                        .DefaultTextStyle(x => x.SemiBold().FontSize(9).FontColor(Colors.Black));
                });

                foreach (var item in bill.Items)
                {
                    var index = bill.Items.IndexOf(item) + 1;
                    
                    var taxAmount = item.CGST + item.SGST + item.IGST;
                    var baseAmount = item.Price * item.Quantity;
                    var gstPercent = baseAmount > 0 ? (taxAmount / baseAmount) * 100 : 0;

                    table.Cell().Element(CellStyle).Text(index.ToString());
                    table.Cell().Element(CellStyle).Text(item.ItemName).SemiBold();
                    table.Cell().Element(CellStyle).AlignCenter().Text(item.HSNCode ?? "-");
                    table.Cell().Element(CellStyle).AlignCenter().Text($"{item.Price:N2}");
                    table.Cell().Element(CellStyle).AlignCenter().Text(item.Quantity.ToString());
                    table.Cell().Element(CellStyle).AlignRight().Text($"{gstPercent:0}%");
                    table.Cell().Element(CellStyle).AlignRight().Text($"{item.Total:N2}").SemiBold();

                    static IContainer CellStyle(IContainer container) => container
                        .BorderBottom(1).BorderColor(Colors.Black)
                        .PaddingVertical(8)
                        .DefaultTextStyle(x => x.FontSize(10));
                }
            });
        }

        void ComposeFooter(IContainer container)
        {
            container.Column(col => 
            {
                col.Item().PaddingBottom(20).AlignRight().Column(sig => 
                {
                    sig.Item().AlignRight().Text($"For {bill.ShopOwner?.ShopName}").FontSize(10).SemiBold();
                    
                    sig.Item().PaddingVertical(10).AlignRight().Container()
                        .Border(1).BorderColor(Colors.Black)
                        .PaddingHorizontal(15).PaddingVertical(8)
                        .Row(row => 
                        {
                            row.Spacing(5);
                            row.AutoItem().Text("✓").FontColor(Colors.Black).Bold();
                            row.AutoItem().Text("Digitally Signed").FontColor(Colors.Black).SemiBold().FontSize(10);
                        });

                    sig.Item().AlignRight().Text("Authorized Signatory").FontSize(9).FontColor(Colors.Black);
                });

                col.Item().BorderTop(1).BorderColor(Colors.Black).PaddingTop(10).AlignCenter().Text(text => 
                {
                    text.Span("Powered by ").FontSize(9).FontColor(Colors.Black);
                    text.Span("Vinshri Billing").FontSize(9).Bold().FontColor(Colors.Black);
                });
            });
        }
    }
}
