using BillingApp.API.Entities;

namespace BillingApp.API.Services;

public interface IPdfService
{
    byte[] GenerateInvoicePdf(Bill bill);
}
