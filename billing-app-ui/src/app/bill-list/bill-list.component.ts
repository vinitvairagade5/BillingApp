import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { InvoiceService, Bill } from '../invoice.service';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, RouterModule],
  template: `
    <div class="dashboard-content">
      <header class="page-header">
        <div>
          <h1>Invoices Dashboard</h1>
          <p class="subtitle">Overview of your business transactions</p>
        </div>
        <button class="btn btn-primary main-cta" routerLink="/create">
          <span class="icon">➕</span> Create New Invoice
        </button>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card glass">
          <div class="stat-icon blue">📜</div>
          <div class="stat-info">
            <span class="stat-label">Total Invoices</span>
            <span class="stat-value">{{ bills.length }}</span>
          </div>
        </div>
        <div class="stat-card glass">
          <div class="stat-icon green">💰</div>
          <div class="stat-info">
            <span class="stat-label">Total Revenue</span>
            <span class="stat-value">{{ getTotalRevenue() | currency:'INR' }}</span>
          </div>
        </div>
        <div class="stat-card glass">
          <div class="stat-icon orange">📅</div>
          <div class="stat-info">
            <span class="stat-label">This Month</span>
            <span class="stat-value">{{ getMonthlyRevenue() | currency:'INR' }}</span>
          </div>
        </div>
      </div>
      
      <div class="card table-card glass">
        <div class="card-header">
          <h3>Recent Transactions</h3>
          <div class="filter-actions">
            <button class="btn-text">View All</button>
          </div>
        </div>
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Invoice Details</th>
                <th>Customer</th>
                <th>Status</th>
                <th class="text-right">Amount</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of bills">
                <td>
                  <div class="invoice-info">
                    <span class="bill-num">{{ bill.billNumber }}</span>
                    <span class="bill-date">{{ bill.date | date:'mediumDate' }}</span>
                  </div>
                </td>
                <td>
                  <div class="customer-info">
                    <span class="cust-name">{{ bill.customer?.name || 'Walk-in Customer' }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge success">Paid</span>
                </td>
                <td class="text-right amount-cell">
                  {{ bill.totalAmount | currency:'INR' }}
                </td>
                <td>
                  <div class="action-group">
                    <button class="btn-action view" [routerLink]="['/bills', bill.id]" title="View Invoice">
                      👁️ View
                    </button>
                    <button class="btn-action download" (click)="downloadPdf(bill.id)" title="Download PDF">
                      📄 PDF
                    </button>
                    <button class="btn-action whatsapp" (click)="shareWhatsapp(bill.id)" title="Share on WhatsApp">
                      💬 WhatsApp
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="bills.length === 0">
                <td colspan="5" class="empty-state">
                  <div class="empty-content">
                    <div class="empty-icon">📂</div>
                    <p>No invoices found. Start by creating your first bill!</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-content { animation: fadeIn 0.5s ease-out; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .page-header h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }
    
    .btn-primary.main-cta { padding: 14px 28px; font-size: 16px; border-radius: 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 15px -3px hsla(221, 83%, 53%, 0.3); }

    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }
    .stat-card { padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; }
    .stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .stat-icon.blue { background: #eff6ff; }
    .stat-icon.green { background: #f0fdf4; }
    .stat-icon.orange { background: #fff7ed; }
    
    .stat-info { display: flex; flex-direction: column; }
    .stat-label { color: #64748b; font-size: 14px; font-weight: 500; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; }

    /* Table Card */
    .table-card { border-radius: 24px; border: none; overflow: hidden; }
    .card-header { padding: 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); }
    .card-header h3 { margin: 0; font-size: 18px; }
    
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 16px 24px; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; background: rgba(248, 250, 252, 0.5); }
    .premium-table td { padding: 20px 24px; border-bottom: 1px solid rgba(241, 245, 249, 0.8); }
    
    .invoice-info { display: flex; flex-direction: column; }
    .bill-num { font-weight: 700; color: var(--primary); font-size: 15px; }
    .bill-date { font-size: 13px; color: #64748b; }
    
    .cust-name { font-weight: 600; color: #1e293b; }
    
    .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-badge.success { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
    
    .amount-cell { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #0f172a; font-size: 16px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    
    .action-group { display: flex; gap: 8px; justify-content: center; }
    .btn-action { padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: white; font-size: 12px; font-weight: 600; cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 4px; }
    .btn-action.view { color: #1e40af; background: #eff6ff; border-color: #dbeafe; }
    .btn-action.view:hover { background: #dbeafe; }
    .btn-action:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 6px -1px var(--primary-glow); }
    
    .empty-state { padding: 80px !important; text-align: center; }
    .empty-icon { font-size: 48px; margin-bottom: 16px; }
    .empty-content p { color: #64748b; font-size: 16px; font-weight: 500; }

    .btn-text { background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; font-size: 14px; }
  `]
})
export class BillListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService); // Injected AuthService
  bills: any[] = []; // Changed type from Bill[] to any[]

  // Use dynamic shopOwnerId from auth service
  get shopOwnerId(): number {
    return this.authService.currentUserValue?.id ?? 1;
  }

  ngOnInit(): void { // Changed return type to void
    this.loadBills();
  }

  loadBills() {
    this.invoiceService.getBills(this.shopOwnerId).subscribe({
      next: (data) => this.bills = data,
      error: (err) => console.error('Failed to load bills', err)
    });
  }

  getTotalRevenue(): number {
    return this.bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return this.bills
      .filter(bill => {
        const date = new Date(bill.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, bill) => sum + bill.totalAmount, 0);
  }

  downloadPdf(id: number) {
    this.invoiceService.downloadPdf(id);
  }

  shareWhatsapp(id: number) {
    this.invoiceService.getWhatsappUrl(id).subscribe({
      next: (res) => {
        window.open(res.url, '_blank');
      },
      error: (err) => console.error('Failed to get WhatsApp URL', err)
    });
  }
}
