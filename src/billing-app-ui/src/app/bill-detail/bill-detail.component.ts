import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../auth.service';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeModule],
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
        <div class="row align-items-start mb-5">
          <div class="col-sm-7">
            <h1 class="display-6 fw-extrabold text-primary text-uppercase mb-2">{{ bill.shopOwner?.shopName || 'MY SHOP' }}</h1>
            <div class="text-secondary small">
              <p class="mb-1">{{ bill.shopOwner?.address }}</p>
              <p class="mb-1" *ngIf="bill.shopOwner?.gstin"><strong>GSTIN:</strong> {{ bill.shopOwner?.gstin }}</p>
              <p class="mb-0" *ngIf="bill.shopOwner?.mobile"><strong>Phone:</strong> {{ bill.shopOwner?.mobile }}</p>
            </div>
          </div>
          <div class="col-sm-5 text-sm-end mt-4 mt-sm-0">
            <h2 class="h4 text-muted fw-bold tracking-widest text-uppercase mb-3">Tax Invoice</h2>
            <div class="small">
              <div class="mb-1 text-muted">Invoice No: <span class="text-dark fw-bold">#{{ bill.billNumber }}</span></div>
              <div class="mb-1 text-muted">Date: <span class="text-dark fw-bold">{{ bill.date | date:'dd MMM yyyy' }}</span></div>
              <div class="mt-2">
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

        <hr class="my-4 text-muted opacity-25">

        <!-- Customer Section -->
        <div class="row mb-5">
          <div class="col-12">
            <div class="text-muted small fw-bold tracking-wider mb-2">BILLED TO</div>
            <h3 class="h5 fw-bold mb-1">{{ bill.customer?.name }}</h3>
            <div class="text-secondary small">
              <p class="mb-0">{{ bill.customer?.mobile }}</p>
              <p class="mb-0 text-wrap" style="max-width: 350px;">{{ bill.customer?.address }}</p>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-responsive mb-5 border-bottom">
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
        <div class="row g-4 align-items-start mb-5 pb-5 border-bottom">
          <div class="col-md-7 pe-md-5">
             <div class="row g-3">
                <div class="col-sm-6">
                   <div class="p-3 bg-light rounded-3 h-100">
                      <div class="text-muted small fw-bold mb-1">PAYMENT DETAILS</div>
                      <div class="fw-bold text-dark fs-6">{{ bill.paymentMethod || 'CASH' }}</div>
                   </div>
                </div>
                
                <div class="col-sm-6" *ngIf="bill.shopOwner?.upiId && bill.paymentMethod === 'CREDIT'">
                   <div class="d-flex gap-3 align-items-center p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-10">
                      <div class="bg-white p-1 rounded">
                        <qrcode [qrdata]="getUpiString()" [width]="70" [margin]="1" [errorCorrectionLevel]="'M'"></qrcode>
                      </div>
                      <div>
                        <div class="text-primary small fw-bold mb-1">SCAN TO PAY</div>
                        <div class="text-dark small fw-bold font-monospace">{{ bill.shopOwner.upiId }}</div>
                      </div>
                   </div>
                </div>
             </div>

             <div class="mt-4">
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
            <div class="text-end mt-2">
               <small class="text-muted fst-italic">(Inclusive of all GST charges)</small>
            </div>
          </div>
        </div>

        <!-- Signature Section -->
        <div class="row align-items-end pt-4">
          <div class="col-6">
             <!-- Empty space for extra branding or QR if needed -->
          </div>
          <div class="col-6 text-center">
             <div class="ms-auto" style="max-width: 250px;">
                <p class="text-dark small fw-bold mb-4">For {{ bill.shopOwner?.shopName }}</p>
                <div class="digital-stamp mx-auto mb-2 d-flex align-items-center justify-content-center gap-2">
                   <span class="badge bg-success rounded-circle p-1"><span class="icon">✓</span></span>
                   <span class="text-success small fw-bold">DIGITALLY SIGNED</span>
                </div>
                <p class="text-muted small mb-0 border-top pt-2">Authorized Signatory</p>
             </div>
          </div>
        </div>

        <div class="mt-5 pt-5 text-center footer-notes text-muted">
          Thank you for your business! Generated via <span class="fw-bold text-primary opacity-75">Vinshri Billing</span>
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
        }
        body { margin: 0; padding: 0; }
        @page { margin: 1.5cm; }
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

  getUpiString(): string {
    if (!this.bill?.shopOwner?.upiId) return '';

    // Format: upi://pay?pa=ADDRESS&pn=NAME&am=AMOUNT&tn=NOTE
    const pa = this.bill.shopOwner.upiId;
    const pn = encodeURIComponent(this.bill.shopOwner.shopName);
    const am = this.bill.totalAmount;
    const tn = encodeURIComponent(`Bill \${this.bill.billNumber}`);

    return `upi://pay?pa=\${pa}&pn=\${pn}&am=\${am}&tn=\${tn}`;
  }
}
