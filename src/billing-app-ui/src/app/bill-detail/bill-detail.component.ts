import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../auth.service';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid py-4 animate-fade-in" *ngIf="bill">
      
      <!-- Action Bar (No Print) -->
      <div class="row mb-4 align-items-center no-print g-3">
        <div class="col-auto">
          <button class="btn btn-link link-secondary text-decoration-none fw-bold" routerLink="/bills">
            <span class="fs-5">←</span> Back to Dashboard
          </button>
        </div>
        <div class="col text-end">
          <div class="d-flex gap-2 justify-content-end flex-wrap">
            <button class="btn btn-whatsapp rounded-pill px-4" (click)="shareOnWhatsapp()">
              📱 Share WhatsApp
            </button>
            <button class="btn btn-outline-primary rounded-pill px-4" (click)="downloadPdf()">
              ⬇️ PDF
            </button>
            <button class="btn btn-primary rounded-pill px-4 shadow-sm" (click)="printInvoice()">
              🖨️ Print Invoice
            </button>
          </div>
        </div>
      </div>

      <!-- Invoice Paper -->
      <div class="invoice-paper border-0 shadow-lg mx-auto bg-white rounded-3">
        
        <!-- Header Section -->
        <div class="row align-items-start mb-3">
          <div class="col-sm-7">
            <h1 class="display-6 fw-extrabold text-primary text-uppercase mb-2">{{ bill.shopOwner?.shopName || 'MY SHOP' }}</h1>
            <div class="text-secondary small">
              <p class="mb-1">{{ bill.shopOwner?.address }}</p>
              <p class="mb-1" *ngIf="bill.shopOwner?.gstin"><strong>GSTIN:</strong> {{ bill.shopOwner?.gstin }}</p>
              <p class="mb-0" *ngIf="bill.shopOwner?.mobile"><strong>Phone:</strong> {{ bill.shopOwner?.mobile }}</p>
            </div>
          </div>
          <div class="col-sm-5 ms-sm-auto text-sm-end mt-4 mt-sm-0">
            <h2 class="h4 text-muted fw-bold tracking-widest text-uppercase mb-3">Tax Invoice</h2>
            <div class="small">
              <div class="mb-1 text-muted">Invoice No: <span class="text-dark fw-bold">#{{ bill.billNumber }}</span></div>
              <div class="mb-1 text-muted">Date: <span class="text-dark fw-bold">{{ bill.date | date:'dd MMM yyyy' }}</span></div>
              <div class="mt-2 text-end">
                <span class="badge rounded-pill fw-bold" 
                      [class.bg-success-subtle]="bill.paymentMethod !== 'CREDIT'" 
                      [class.text-success]="bill.paymentMethod !== 'CREDIT'"
                      [class.bg-danger-subtle]="bill.paymentMethod === 'CREDIT'"
                      [class.text-danger]="bill.paymentMethod === 'CREDIT'">
                  {{ bill.paymentMethod === 'CREDIT' ? 'PAYMENT DUE' : 'PAID IN FULL' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr class="my-3 text-muted opacity-25">

        <!-- Customer Section -->
        <div class="row mb-3">
          <div class="col-12">
            <div class="d-flex align-items-center flex-wrap gap-2">
               <span class="text-muted small fw-bold tracking-wider me-1">BILLED TO:</span>
               <h3 class="h6 fw-bold mb-0 text-dark">{{ bill.customer?.name }}</h3>
               <span class="text-secondary small ms-2" *ngIf="bill.customer?.mobile">📞 {{ bill.customer?.mobile }}</span>
               <span class="text-secondary small ms-2 text-truncate" style="max-width: 350px;" *ngIf="bill.customer?.address">📍 {{ bill.customer?.address }}</span>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-responsive mb-3 border-bottom">
          <table class="table table-borderless">
            <thead class="bg-light border-bottom">
              <tr class="text-muted small fw-bold">
                <th class="py-3 px-2">#</th>
                <th class="py-3 px-2">Description</th>
                <th class="py-3 px-2 text-center">HSN</th>
                <th class="py-3 px-2 text-center">Price</th>
                <th class="py-3 px-2 text-center">Qty</th>
                <th class="py-3 px-2 text-center">GST</th>
                <th class="py-3 px-2 text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of bill.items; let i = index" class="border-bottom border-light">
                <td class="py-3 px-2">{{ i + 1 }}</td>
                <td class="py-3 px-2 fw-semibold text-dark">{{ item.itemName }}</td>
                <td class="py-3 px-2 text-center text-muted small">{{ item.hsnCode || '-' }}</td>
                <td class="py-3 px-2 text-center">₹{{ item.price | number:'1.2-2' }}</td>
                <td class="py-3 px-2 text-center fw-bold">{{ item.quantity }}</td>
                <td class="py-3 px-2 text-center text-muted">{{ getGstRate(item) | number:'1.0-0' }}%</td>
                <td class="py-3 px-2 text-end fw-bold">₹{{ item.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary Section -->
        <div class="row g-4 align-items-start mb-3 pb-3 mb-print-1 pb-print-1 border-bottom">
          <div class="col-md-7 pe-md-5">
             <div class="mt-2">
                <div class="text-muted small fw-bold mb-2">TERMS & CONDITIONS</div>
                <div class="text-muted small lh-base">
                  1. Goods once sold will not be taken back.<br>
                  2. All disputes are subject to local jurisdiction only.<br>
                  3. Please notify us of any discrepancies within 24 hours.
                </div>
             </div>
          </div>

          <div class="col-md-5">
            <div class="list-group list-group-flush">
              <div class="list-group-item bg-transparent d-flex justify-content-between p-2 border-0">
                <span class="text-muted">Subtotal</span>
                <span class="fw-semibold">₹{{ bill.subTotal | number:'1.2-2' }}</span>
              </div>
              <div class="list-group-item bg-transparent d-flex justify-content-between p-2 border-0" *ngIf="bill.totalCGST">
                <span class="text-muted">CGST</span>
                <span class="fw-semibold">₹{{ bill.totalCGST | number:'1.2-2' }}</span>
              </div>
              <div class="list-group-item bg-transparent d-flex justify-content-between p-2 border-0" *ngIf="bill.totalSGST">
                <span class="text-muted">SGST</span>
                <span class="fw-semibold">₹{{ bill.totalSGST | number:'1.2-2' }}</span>
              </div>
              <div class="list-group-item bg-transparent d-flex justify-content-between p-3 border-top mt-2 border-2 text-dark">
                <span class="fw-bold h5 mb-0">TOTAL</span>
                <span class="fw-extrabold h4 mb-0 text-primary">₹{{ bill.totalAmount | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- State Handlers -->
    <div class="d-flex align-items-center justify-content-center min-vh-100" *ngIf="!bill && !error">
       <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
       </div>
    </div>

    <div class="container py-5 text-center min-vh-100 d-flex flex-column align-items-center justify-content-center" *ngIf="error">
       <div class="display-1 text-danger mb-4">❌</div>
       <h2 class="h3 fw-bold mb-3">Invoice Not Found</h2>
       <p class="text-muted mb-4">{{ error }}</p>
       <button class="btn btn-primary rounded-pill px-5" routerLink="/bills">Back to Dashboard</button>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .invoice-paper {
        max-width: 850px;
        min-height: 1100px;
        padding: 60px;
        margin-bottom: 50px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
    }

    .fw-extrabold { font-weight: 800; }
    .tracking-widest { letter-spacing: 0.2em; }
    .tracking-wider { letter-spacing: 0.1em; }

    .digital-stamp {
       padding: 8px 16px;
       border: 1px dashed var(--bs-success);
       background: rgba(var(--bs-success-rgb), 0.05);
       border-radius: 8px;
    }

    .btn-whatsapp { background: #25d366; color: white; border: none; }
    .btn-whatsapp:hover { background: #128c7e; color: white; transform: translateY(-1px); }

    /* Print Overrides */
    @media print {
        :host { background: white !important; padding: 0 !important; }
        .container-fluid { padding: 0 !important; }
        .no-print { display: none !important; }
        .invoice-paper { 
          box-shadow: none !important; 
          border: none !important; 
          padding: 0 !important; 
          margin: 0 !important; 
          max-width: none !important;
          min-height: auto !important;
        }
        
        /* Reduce spacing for a compact print layout */
        .mb-5 { margin-bottom: 1rem !important; }
        .pb-5 { padding-bottom: 1rem !important; }
        .mt-4 { margin-top: 0.5rem !important; }
        .my-4 { margin-top: 1rem !important; margin-bottom: 1rem !important; }
        .pt-5 { padding-top: 1rem !important; }
        .pt-4 { padding-top: 0.5rem !important; }
        .mb-4 { margin-bottom: 1rem !important; }

        body { margin: 0; padding: 0; }
        @page { margin: 0.5cm; size: auto; }
    }

    @media (max-width: 768px) {
        .invoice-paper { padding: 30px 20px; }
        .display-6 { font-size: 1.5rem; }
    }
  `]
})
export class BillDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  bill: any = null;
  error: string | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBill(Number(id));
    } else {
      this.error = "Invalid Invoice ID";
    }
  }

  loadBill(id: number) {
    this.invoiceService.getById(id).subscribe({
      next: (res) => this.bill = res,
      error: (err) => {
        console.error(err);
        this.error = "Could not load invoice. It might have been deleted.";
      }
    });
  }

  downloadPdf() {
    if (this.bill) this.invoiceService.downloadPdf(this.bill.id);
  }

  // Helper to calculate GST Rate safely
  getGstRate(item: any): number {
    if (!item.price || !item.quantity || item.price === 0) return 0;
    const totalTax = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
    const baseAmount = item.price * item.quantity;
    return (totalTax / baseAmount) * 100;
  }

  shareOnWhatsapp() {
    if (this.bill) {
      this.invoiceService.getWhatsappUrl(this.bill.id).subscribe(res => {
        window.open(res.url, '_blank');
      });
    }
  }

  printInvoice() {
    window.print();
  }
}
