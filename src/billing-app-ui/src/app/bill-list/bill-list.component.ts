import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { InvoiceService, Bill } from '../invoice.service';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';

import { PaymentModalComponent } from '../payment-modal/payment-modal.component';

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
            <span class="stat-value">{{ getTotalInvoices() }}</span>
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
      
      <!-- Mobile Bill List (Visible only on mobile) -->
      <div class="mobile-bill-list">
        <div class="mobile-card glass" *ngFor="let bill of bills">
          <div class="m-card-top">
             <span class="bill-num">{{ bill.billNumber }}</span>
             <span class="status-badge success">Paid</span>
          </div>
          <div class="m-card-mid">
             <div class="m-cust-name">{{ bill.customer?.name || 'Walk-in Customer' }}</div>
             <div class="m-date">{{ bill.date | date:'mediumDate' }}</div>
          </div>
          <div class="m-card-bot">
             <div class="m-amount">{{ bill.totalAmount | currency:'INR' }}</div>
             <div class="m-actions">
                <button class="btn-icon-sm" [routerLink]="['/bills', bill.id]">👁️</button>
                <button class="btn-icon-sm" (click)="downloadPdf(bill.id)">📄</button>
                <button class="btn-icon-sm whatsapp" (click)="shareWhatsapp(bill.id)">💬</button>
             </div>
          </div>
        </div>
        
        <!-- Empty State Mobile -->
        <div class="empty-mobile glass" *ngIf="bills.length === 0">
           <div class="empty-icon">📂</div>
           <p>No invoices found.</p>
        </div>
      </div>

      <div class="card table-card glass hidden-mobile-table">
        <div class="card-header">
          <h3>Recent Transactions</h3>
          <!-- Removed View All Button -->
        </div>
        <div class="table-responsive">
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
                    <!-- Removed Pay Button -->
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
            </div> <!-- End table-responsive -->
            
            <div class="pagination-footer">
                <button class="btn-paginate" (click)="prevPage()" [disabled]="currentPage === 1">
                  <span class="icon">⬅️</span> Previous
                </button>
                <span class="page-info">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
                <button class="btn-paginate" (click)="nextPage()" [disabled]="currentPage === totalPages">
                  Next <span class="icon">➡️</span>
                </button>
            </div>
          <!-- End table-card -->
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
    .table-card { 
        border: 1px solid rgba(255, 255, 255, 0.6); 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); 
        border-radius: 20px; 
        background: rgba(255, 255, 255, 0.7); 
        backdrop-filter: blur(20px);
        display: flex;
        flex-direction: column;
    }
    
    .card-header { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(226, 232, 240, 0.6); }
    .card-header h3 { margin: 0; font-size: 18px; color: #1e293b; letter-spacing: -0.01em; }
    
    .premium-table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
    .premium-table th { padding: 16px 32px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; background: rgba(248, 250, 252, 0.5); border-bottom: 1px solid var(--border-color); }
    .premium-table td { padding: 20px 32px; border-bottom: 1px solid rgba(241, 245, 249, 0.8); transition: background-color 0.2s ease; }
    
    /* Hover Effect */
    .premium-table tbody tr:hover td {
        background-color: rgba(239, 246, 255, 0.4);
    }
    /* Remove border from last row */
    .premium-table tbody tr:last-child td { border-bottom: none; }

    .invoice-info { display: flex; flex-direction: column; gap: 2px; }
    .bill-num { font-weight: 700; color: var(--primary); font-size: 15px; letter-spacing: -0.01em; }
    .bill-date { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .cust-name { font-weight: 600; color: #334155; }
    
    .status-badge { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }
    .status-badge.success { background: #dcfce7; color: #15803d; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    
    .amount-cell { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 700; color: #0f172a; font-size: 15px; }
    
    .action-group { display: flex; gap: 8px; justify-content: center; }
    .btn-action { 
        padding: 8px 14px; 
        border-radius: 10px; 
        border: 1px solid transparent; 
        background: white; 
        font-size: 12px; 
        font-weight: 600; 
        cursor: pointer; 
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
        display: flex; align-items: center; gap: 6px; 
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        color: #475569;
    }
    .btn-action:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    
    /* Specific Button Colors */
    .btn-action.view:hover { color: #2563eb; border-color: #dbeafe; background: #eff6ff; }
    .btn-action.download:hover { color: #4b5563; border-color: #e5e7eb; background: #f9fafb; }
    .btn-action.pay:hover { color: #059669; border-color: #d1fae5; background: #ecfdf5; }
    .btn-action.whatsapp:hover { color: #16a34a; border-color: #dcfce7; background: #f0fdf4; }

    .pagination-footer { 
        padding: 20px 32px; 
        border-top: 1px solid rgba(226, 232, 240, 0.6); 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        background: rgba(255, 255, 255, 0.3);
    }
    .page-info { font-size: 13px; font-weight: 600; color: #64748b; background: rgba(255,255,255,0.5); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.05); }
    .btn-paginate { 
        padding: 8px 16px; 
        border-radius: 12px; 
        border: 1px solid rgba(226, 232, 240, 0.8); 
        background: white; 
        color: #475569; 
        font-weight: 600; 
        font-size: 13px; 
        cursor: pointer; 
        transition: all 0.2s; 
        display: flex; align-items: center; gap: 8px; 
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .btn-paginate:hover:not(:disabled) { 
        border-color: var(--primary); 
        color: var(--primary); 
        background: #f8fafc; 
        transform: translateY(-1px); 
        box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1); 
    }
    .btn-paginate:disabled { opacity: 0.5; cursor: not-allowed; background: #f1f5f9; box-shadow: none; }

    /* --- MOBILE STYLES --- */
    .mobile-bill-list { display: none; }
    
    @media (max-width: 640px) {
        .page-header { flex-direction: column; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
        .page-header h1 { font-size: 24px; }
        .btn-primary.main-cta { width: 100%; justify-content: center; }
        
        /* Scrolling Stats */
        .stats-grid {
            display: flex;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            gap: 12px;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
            margin-bottom: 24px;
        }
        .stats-grid::-webkit-scrollbar { display: none; }

        .stat-card {
             flex-direction: column;
             align-items: flex-start;
             padding: 12px 16px;
             gap: 8px;
             min-width: 140px;
             height: auto;
             scroll-snap-align: start;
             flex-shrink: 0;
             background: white; /* fallback */
        }
        
        .stat-icon { width: 40px; height: 40px; font-size: 1.2rem; margin-bottom: 0; }
        .stat-label { font-size: 11px; white-space: nowrap; }
        .stat-value { font-size: 1.2rem; margin-top: 0; }

        /* Hide Table, Show List */
        .hidden-mobile-table { display: none !important; }
        .mobile-bill-list { display: flex; flex-direction: column; gap: 12px; }
        
        .mobile-card {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid white;
            padding: 16px;
            border-radius: 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.03);
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .m-card-top { display: flex; justify-content: space-between; align-items: center; }
        .m-card-mid { display: flex; flex-direction: column; gap: 2px; }
        .m-cust-name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
        .m-date { font-size: 0.8rem; color: #94a3b8; }
        
        .m-card-bot { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding-top: 12px; 
            border-top: 1px solid rgba(0,0,0,0.05);
        }
        .m-amount { font-weight: 700; font-size: 1.1rem; color: #0f172a; }
        
        .m-actions { display: flex; gap: 8px; }
        .btn-icon-sm {
            width: 32px; height: 32px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: white;
            display: flex; align-items: center; justify-content: center;
            font-size: 1rem;
        }
        .btn-icon-sm.whatsapp { color: #16a34a; border-color: #dcfce7; background: #f0fdf4; }
        
        .empty-mobile { 
            text-align: center; 
            padding: 40px; 
            background: rgba(255,255,255,0.5); 
            border-radius: 16px; 
        }
    }
  `]
})
export class BillListComponent implements OnInit {
  private invoiceService = inject(InvoiceService);
  private authService = inject(AuthService); // Injected AuthService
  bills: any[] = [];
  dashboardStats: any = {};

  // Pagination State
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;

  ngOnInit(): void {
    // Payment specific user data fetching removed
    this.loadBills();
    this.loadDashboardStats();
  }

  loadBills() {
    this.invoiceService.getBills(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        this.bills = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages;
      },
      error: (err) => console.error('Failed to load bills', err)
    });
  }

  loadDashboardStats() {
    this.invoiceService.getDashboardStats().subscribe({
      next: (data) => this.dashboardStats = data,
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  getTotalRevenue(): number {
    return this.dashboardStats.totalSales || 0;
  }

  getMonthlyRevenue(): number {
    return this.dashboardStats.monthlySales || 0;
  }

  getTotalInvoices(): number {
    return this.dashboardStats.totalInvoices || 0;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBills();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBills();
    }
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
