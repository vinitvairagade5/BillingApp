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
    <div class="page-container animation-fade-in" *ngIf="bill">
      
      <!-- Action Bar (No Print) -->
      <header class="action-bar no-print">
        <button class="btn-back" routerLink="/bills">← Back</button>
        <div class="actions">
          <button class="btn btn-whatsapp" (click)="shareOnWhatsapp()">
            <span class="icon">📱</span> Share WhatsApp
          </button>
          <button class="btn btn-primary" (click)="downloadPdf()">
            <span class="icon">⬇️</span> Download PDF
          </button>
          <button class="btn btn-print" (click)="printInvoice()">
            <span class="icon">🖨️</span> Print
          </button>
        </div>
      </header>

      <!-- Invoice Paper -->
      <div class="invoice-paper shadow-premium">
        
        <!-- Header Section -->
        <div class="invoice-header">
          <div class="brand-section">
            <h1 class="shop-name">{{ bill.shopOwner?.shopName || 'MY SHOP' }}</h1>
            <div class="shop-details">
              <p>{{ bill.shopOwner?.address }}</p>
              <p *ngIf="bill.shopOwner?.gstin"><strong>GSTIN:</strong> {{ bill.shopOwner?.gstin }}</p>
              <p *ngIf="bill.shopOwner?.mobile"><strong>Phone:</strong> {{ bill.shopOwner?.mobile }}</p>
            </div>
          </div>
          <div class="invoice-meta">
            <h2 class="invoice-title">TAX INVOICE</h2>
            <div class="meta-grid">
              <div class="meta-row">
                <span class="label">Invoice No:</span>
                <span class="value fw-bold">#{{ bill.billNumber }}</span>
              </div>
              <div class="meta-row">
                <span class="label">Date:</span>
                <span class="value">{{ bill.date | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="meta-row payment-status" [class.paid]="bill.paymentMethod !== 'CREDIT'" [class.due]="bill.paymentMethod === 'CREDIT'">
                <span class="label">Status:</span>
                <span class="badge">{{ bill.paymentMethod === 'CREDIT' ? 'PAYMENT DUE' : 'PAID' }}</span>
              </div>
            </div>
          </div>
        </div>

        <hr class="divider">

        <!-- Customer Section -->
        <div class="bill-to-section">
          <div class="section-label">BILLED TO</div>
          <div class="customer-details">
            <h3 class="customer-name">{{ bill.customer?.name }}</h3>
            <p *ngIf="bill.customer?.mobile">{{ bill.customer?.mobile }}</p>
            <p *ngIf="bill.customer?.address" class="address">{{ bill.customer?.address }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 40%">Item Description</th>
                <th class="text-center" style="width: 10%">HSN</th>
                <th class="text-center" style="width: 15%">Price</th>
                <th class="text-center" style="width: 10%">Qty</th>
                <th class="text-center" style="width: 10%">GST</th>
                <th class="text-center" style="width: 10%">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of bill.items; let i = index">
                <td>{{ i + 1 }}</td>
                <td>
                  <div class="item-name">{{ item.itemName }}</div>
                </td>
                <td class="text-center text-muted small">{{ item.hsnCode || '-' }}</td>
                <td class="text-center">₹{{ item.price | number:'1.2-2' }}</td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-center text-muted">{{ getGstRate(item) | number:'1.0-0' }}%</td>
                <td class="text-right fw-bold">₹{{ item.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary Section -->
        <div class="footer-section">
          <div class="payment-info">
             <div class="info-box">
                <p class="label">PAYMENT METHOD</p>
                <p class="value">{{ bill.paymentMethod || 'CASH' }}</p>
             </div>

             <!-- UPI QR Code Section -->
             <div class="upi-box" *ngIf="bill.shopOwner?.upiId">
                <div class="upi-container">
                    <qrcode [qrdata]="getUpiString()" [width]="100" [margin]="2" [errorCorrectionLevel]="'M'"></qrcode>
                </div>
                <div class="upi-details">
                    <p class="label">SCAN TO PAY</p>
                    <p class="upi-id">{{ bill.shopOwner.upiId }}</p>
                </div>
             </div>

             <div class="terms-box">
                <p class="label">TERMS & CONDITIONS</p>
                <p class="small text-muted">1. Goods once sold will not be taken back.<br>2. Interest at 18% p.a. will be charged if not paid by due date.</p>
             </div>
          </div>

          <div class="totals-box glass">
            <div class="summary-item">
              <span>Subtotal</span>
              <span>₹{{ bill.subTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-item" *ngIf="bill.totalCGST">
              <span>CGST ({{ (bill.subTotal ? (bill.totalCGST / bill.subTotal * 100) : 0) | number:'1.0-1' }}%)</span>
              <span>₹{{ bill.totalCGST | number:'1.2-2' }}</span>
            </div>
            <div class="summary-item" *ngIf="bill.totalSGST">
              <span>SGST ({{ (bill.subTotal ? (bill.totalSGST / bill.subTotal * 100) : 0) | number:'1.0-1' }}%)</span>
              <span>₹{{ bill.totalSGST | number:'1.2-2' }}</span>
            </div>
            <div class="summary-item" *ngIf="bill.totalIGST">
              <span>IGST ({{ (bill.subTotal ? (bill.totalIGST / bill.subTotal * 100) : 0) | number:'1.0-1' }}%)</span>
              <span>₹{{ bill.totalIGST | number:'1.2-2' }}</span>
            </div>
            <div class="grand-total-row">
              <span>TOTAL</span>
              <span class="amount">₹{{ bill.totalAmount | number:'1.2-2' }}</span>
            </div>
            <div class="amount-in-words">
               <!-- Placeholder for amount in words if implemented on backend -->
               <small>(Inclusive of all taxes)</small>
            </div>
          </div>
        </div>

        <!-- Signature -->
        <div class="signature-section">
          <div class="signature-box">
            <p>For {{ bill.shopOwner?.shopName }}</p>
            <div class="digital-sign">
               <span class="sign-icon">✅</span>
               <span class="sign-text">Digitally Signed</span>
            </div>
            <p class="auth-sign">Authorized Signatory</p>
          </div>
        </div>

        <div class="footer-branding">
          Powered by <strong>Vinshri Billing</strong>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="!bill && !error">
       <div class="spinner"></div>
    </div>

    <div class="error-state" *ngIf="error">
       <h2>❌ Invoice Not Found</h2>
       <p>{{ error }}</p>
       <button class="btn btn-primary" routerLink="/bills">Back</button>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
        display: block;
        background: #f1f5f9;
        min-height: 100vh;
        font-family: 'Inter', sans-serif;
        color: #0f172a;
        padding-bottom: 40px;
    }

    .page-container {
        max-width: 850px; /* A4 Width approx */
        margin: 0 auto;
        padding: 20px;
    }

    /* Action Bar */
    .action-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
    }
    .btn-back {
        background: none;
        border: none;
        color: #64748b;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
    }
    .btn-back:hover { color: #0f172a; }
    .actions { display: flex; gap: 12px; }

    /* Invoice Paper */
    .invoice-paper {
        background: white;
        padding: 48px;
        border-radius: 4px; /* Slight radius but sharp enough for paper feel */
        position: relative;
    }
    .shadow-premium {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }

    /* Header */
    .invoice-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 32px;
    }
    .shop-name {
        font-size: 24px;
        font-weight: 800;
        color: var(--primary);
        text-transform: uppercase;
        margin: 0 0 8px 0;
        letter-spacing: -0.02em;
    }
    .shop-details p { margin: 2px 0; font-size: 14px; color: #475569; }
    
    .invoice-title {
        font-size: 20px;
        font-weight: 700;
        text-align: right;
        margin: 0 0 16px 0;
        color: #94a3b8;
        letter-spacing: 0.1em;
    }
    .meta-grid { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
    .meta-row { display: flex; gap: 12px; font-size: 14px; }
    .meta-row .label { color: #64748b; font-weight: 500; }
    .meta-row .value { color: #0f172a; }

    .payment-status .badge {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 700;
        text-transform: uppercase;
    }
    .payment-status.paid .badge { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .payment-status.due .badge { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

    .divider { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }

    /* Customer */
    .bill-to-section { margin-bottom: 40px; }
    .section-label { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 8px; }
    .customer-name { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
    .customer-details p { margin: 0; color: #475569; font-size: 14px; }
    .customer-details .address { max-width: 300px; line-height: 1.4; margin-top: 4px; }

    /* Table */
    .table-container { margin-bottom: 40px; }
    .premium-table { width: 100%; border-collapse: collapse; }
    .premium-table th {
        text-align: left;
        padding: 12px 8px;
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        border-bottom: 2px solid #e2e8f0;
    }
    .premium-table td {
        padding: 16px 8px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 14px;
        vertical-align: top;
        color: #334155;
    }
    .premium-table tr:last-child td { border-bottom: none; }
    .item-name { font-weight: 500; color: #0f172a; }

    /* Footer Stats */
    .footer-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 60px;
    }
    .payment-info { flex: 1; padding-right: 40px; display: flex; flex-direction: column; gap: 24px; }
    .info-box .label { font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 4px; }
    .info-box .value { font-size: 14px; font-weight: 600; }

    .upi-box {
        display: flex;
        gap: 16px;
        align-items: center;
        background: #f8fafc;
        padding: 12px;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        width: fit-content;
    }
    .upi-details .label { font-size: 10px; font-weight: 700; color: #166534; margin: 0 0 4px 0; }
    .upi-details .upi-id { font-size: 12px; font-family: 'Courier New', monospace; margin: 0; color: #0f172a; }

    .totals-box {
        width: 300px;
        background: #f8fafc;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #e2e8f0;
    }
    .totals-box .summary-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #64748b; }
    .grand-total-row {
        display: flex; justify-content: space-between; align-items: center;
        margin-top: 16px; padding-top: 16px; border-top: 2px solid #cbd5e1;
        font-weight: 800; color: #0f172a; font-size: 18px;
    }
    .amount-in-words { text-align: right; margin-top: 8px; font-size: 11px; color: #94a3b8; }

    /* Signature */
    .signature-section { display: flex; justify-content: flex-end; margin-bottom: 40px; page-break-inside: avoid; }
    .signature-box { text-align: center; width: 200px; }
    .signature-box p { font-size: 12px; font-weight: 600; margin: 0; color: #0f172a; }
    .digital-sign { 
        height: 60px; margin: 8px 0; background: #f0fdf4; border: 1px dashed #22c55e; border-radius: 4px;
        display: flex; align-items: center; justify-content: center; gap: 6px; color: #15803d; font-size: 12px; font-weight: 600;
    }
    .auth-sign { font-size: 10px !important; color: #94a3b8 !important; font-weight: 500 !important; text-transform: uppercase; letter-spacing: 0.05em; }

    .footer-branding {
        text-align: center;
        font-size: 10px;
        color: #cbd5e1;
        margin-top: 40px;
    }

    /* Utilities */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-muted { color: #94a3b8; }
    .fw-bold { font-weight: 700; }
    .small { font-size: 12px; }
    
    /* Buttons */
    .btn { padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid transparent; display: flex; align-items: center; gap: 8px; font-size: 14px; transition: all 0.2s; }
    .btn-primary { background: var(--primary); color: white; box-shadow: 0 4px 6px -1px rgba(var(--primary-rgb), 0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 10px -1px rgba(var(--primary-rgb), 0.4); }
    .btn-whatsapp { background: #25d366; color: white; }
    .btn-whatsapp:hover { background: #128c7e; }
    .btn-print { background: white; border: 1px solid #e2e8f0; color: #475569; }
    .btn-print:hover { background: #f8fafc; border-color: #cbd5e1; }

    .loading-state { height: 80vh; display: flex; align-items: center; justify-content: center; }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    /* Print Styles */
    /* Print Styles */
    @media print {
        :host { 
            display: block; 
            background: white; 
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
        }

        .page-container { 
            width: 100%; 
            margin: 0; 
            padding: 0;
            max-width: none; 
            box-shadow: none; 
        }

        .invoice-paper { 
            padding: 20px 40px !important; 
            border: none; 
            box-shadow: none; 
        }

        .no-print { 
            display: none !important; 
        }
        
        /* Ensure background colors print */
        * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
        }
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
