import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-bill-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="detail-page animation-fade-in" *ngIf="bill">
      <header class="page-header">
        <div class="header-info">
          <button class="btn-back" routerLink="/bills">← Back to Bills</button>
          <h1>Invoice Details</h1>
          <p class="subtitle">{{ bill.billNumber }} • {{ bill.date | date:'mediumDate' }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-whatsapp" (click)="shareOnWhatsapp()">
            <span class="icon">📱</span> WhatsApp
          </button>
          <button class="btn btn-primary" (click)="downloadPdf()">
            <span class="icon">📄</span> Download PDF
          </button>
        </div>
      </header>

      <div class="bill-container glass card">
        <!-- Shop & Customer Header -->
        <div class="bill-header">
          <div class="shop-info">
            <h2 class="shop-name">{{ bill.shopOwner?.shopName || 'MY SHOP' }}</h2>
            <p>{{ bill.shopOwner?.address }}</p>
            <p *ngIf="bill.shopOwner?.gstin"><strong>GSTIN:</strong> {{ bill.shopOwner?.gstin }}</p>
          </div>
          <div class="bill-meta">
            <div class="meta-item">
              <span class="label">Invoice No:</span>
              <span class="value">#{{ bill.billNumber }}</span>
            </div>
            <div class="meta-item">
              <span class="label">Date:</span>
              <span class="value">{{ bill.date | date:'dd MMM yyyy' }}</span>
            </div>
          </div>
        </div>

        <div class="customer-info-section">
          <h3>Bill To:</h3>
          <div class="customer-card">
            <h4>{{ bill.customer?.name }}</h4>
            <p>{{ bill.customer?.mobile }}</p>
            <p>{{ bill.customer?.address }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-responsive">
          <table class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">GST %</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of bill.items">
                <td>
                  <div class="item-name">{{ item.itemName }}</div>
                  <small class="hsn" *ngIf="item.hsnCode">HSN: {{ item.hsnCode }}</small>
                </td>
                <td class="text-right">₹{{ item.price | number:'1.2-2' }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ (item.cgst + item.sgst + item.igst) / (item.price * item.quantity) * 100 | number:'1.0-0' }}%</td>
                <td class="text-right font-bold">₹{{ item.total | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="bill-summary">
          <div class="summary-spacer"></div>
          <div class="summary-details">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>₹{{ bill.subTotal | number:'1.2-2' }}</span>
            </div>
            <div class="summary-row" *ngIf="bill.totalCGST">
              <span>CGST</span>
              <span>₹{{ bill.totalCGST | number:'1.2-2' }}</span>
            </div>
            <div class="summary-row" *ngIf="bill.totalSGST">
              <span>SGST</span>
              <span>₹{{ bill.totalSGST | number:'1.2-2' }}</span>
            </div>
            <div class="summary-row" *ngIf="bill.totalIGST">
              <span>IGST</span>
              <span>₹{{ bill.totalIGST | number:'1.2-2' }}</span>
            </div>
            <div class="divider"></div>
            <div class="summary-row grand-total">
              <span>Grand Total</span>
              <span>₹{{ bill.totalAmount | number:'1.2-2' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-state" *ngIf="!bill && !error">
       <div class="spinner"></div>
       <p>Loading Invoice...</p>
    </div>

    <div class="error-state" *ngIf="error">
       <div class="error-icon">❌</div>
       <h2>Invoice Not Found</h2>
       <p>{{ error }}</p>
       <button class="btn btn-primary" routerLink="/bills">Back to Bills</button>
    </div>
  `,
    styles: [`
    .detail-page { padding: 40px; max-width: 1000px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .btn-back { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; padding: 0; margin-bottom: 8px; display: block; font-size: 14px; }
    .page-header h1 { margin: 0; font-size: 28px; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }
    .header-actions { display: flex; gap: 12px; }

    .bill-container { padding: 48px; min-height: 600px; }
    
    .bill-header { display: flex; justify-content: space-between; margin-bottom: 48px; padding-bottom: 32px; border-bottom: 2px solid #f1f5f9; }
    .shop-name { margin: 0 0 8px 0; font-size: 28px; color: var(--primary); letter-spacing: -0.02em; }
    .shop-info p { margin: 2px 0; color: #64748b; font-size: 15px; }
    
    .bill-meta { text-align: right; }
    .meta-item { margin-bottom: 8px; }
    .meta-item .label { color: #94a3b8; font-weight: 600; margin-right: 8px; font-size: 13px; text-transform: uppercase; }
    .meta-item .value { font-weight: 700; color: #1e293b; font-size: 16px; }

    .customer-info-section { margin-bottom: 40px; }
    .customer-info-section h3 { font-size: 14px; text-transform: uppercase; color: #94a3b8; margin-bottom: 16px; letter-spacing: 0.05em; }
    .customer-card { background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; width: fit-content; min-width: 300px; }
    .customer-card h4 { margin: 0 0 8px 0; font-size: 18px; }
    .customer-card p { margin: 4px 0; color: #64748b; font-size: 14px; }

    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    .items-table th { text-align: left; padding: 16px; border-bottom: 2px solid #f1f5f9; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .items-table td { padding: 20px 16px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .item-name { font-weight: 600; color: #1e293b; margin-bottom: 4px; }
    .hsn { font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }

    .bill-summary { display: flex; margin-top: 40px; }
    .summary-spacer { flex: 1; }
    .summary-details { width: 340px; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; color: #64748b; font-weight: 500; }
    .divider { height: 1px; background: #e2e8f0; margin: 16px 0; }
    .grand-total { font-size: 24px; color: var(--primary); font-weight: 800; }

    .btn { padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 8px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-whatsapp { background: #25d366; color: white; }
    .btn-whatsapp:hover { background: #128c7e; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }

    .loading-state, .error-state { padding: 100px; text-align: center; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .error-icon { font-size: 48px; margin-bottom: 16px; }

    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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

    shareOnWhatsapp() {
        if (this.bill) {
            this.invoiceService.getWhatsappUrl(this.bill.id).subscribe(res => {
                window.open(res.url, '_blank');
            });
        }
    }
}
