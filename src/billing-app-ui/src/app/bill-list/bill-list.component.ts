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
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <div class="row g-4 align-items-center mb-4">
        <div class="col-md">
          <h1 class="h3 fw-bold mb-1">Invoices Dashboard</h1>
          <p class="text-secondary small mb-0">Overview of all generated transactions and business performance</p>
        </div>
        <div class="col-md-auto">
          <button class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2" routerLink="/create">
            <span class="fs-5">+</span> Create New Invoice
          </button>
        </div>
      </div>

      <!-- Stats Indicators -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-4">
          <div class="card border-0 bg-light rounded-4 h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center p-2" style="width: 40px; height: 40px;">
                  📜
                </div>
                <span class="text-muted extra-small fw-bold text-uppercase tracking-wider">Total Bills</span>
              </div>
              <h3 class="mb-0 fw-extrabold text-dark">{{ getTotalInvoices() }}</h3>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <div class="card border-0 bg-light rounded-4 h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="rounded-3 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center p-2" style="width: 40px; height: 40px;">
                  💰
                </div>
                <span class="text-muted extra-small fw-bold text-uppercase tracking-wider">Revenue</span>
              </div>
              <h3 class="mb-0 fw-extrabold text-dark">₹{{ getTotalRevenue() | number:'1.0-0' }}</h3>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card border-0 bg-light rounded-4 h-100">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex align-items-center gap-3 mb-2">
                <div class="rounded-3 bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center p-2" style="width: 40px; height: 40px;">
                  📅
                </div>
                <span class="text-muted extra-small fw-bold text-uppercase tracking-wider">This Month</span>
              </div>
              <h3 class="mb-0 fw-extrabold text-dark">₹{{ getMonthlyRevenue() | number:'1.0-0' }}</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoices Main Card -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="card-header bg-white border-bottom border-light py-3 px-4">
            <h5 class="mb-0 fw-bold">Recent Transactions</h5>
        </div>
        
        <div class="table-responsive d-none d-md-block">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr class="text-muted extra-small fw-bold text-uppercase">
                <th class="py-3 px-4 border-0">INVOICE NO.</th>
                <th class="py-3 px-4 border-0">CUSTOMER IDENTITY</th>
                <th class="py-3 px-4 border-0 text-end">TOTAL AMOUNT</th>
                <th class="py-3 px-4 border-0 text-center">QUICK ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of bills" class="border-bottom border-light">
                <td class="py-3 px-4">
                  <div class="fw-bold text-primary fs-6">{{ bill.billNumber }}</div>
                  <div class="text-muted extra-small">{{ bill.date | date:'mediumDate' }}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="fw-bold text-dark">{{ bill.customer?.name || 'Walk-in Customer' }}</div>
                  <div class="text-muted extra-small" *ngIf="bill.customer?.mobile">{{ bill.customer?.mobile }}</div>
                </td>
                <td class="py-3 px-4 text-end fw-extrabold text-dark fs-5">
                  ₹{{ bill.totalAmount | number:'1.2-2' }}
                </td>
                <td class="py-3 px-4">
                  <div class="d-flex gap-2 justify-content-center">
                    <button class="btn btn-light btn-sm rounded-pill px-3 border" [routerLink]="['/bills', bill.id]" title="View Details">
                      👁️ View
                    </button>
                    <button class="btn btn-outline-primary btn-sm rounded-pill px-3" (click)="downloadPdf(bill.id)" title="Get PDF">
                      📄 PDF
                    </button>
                    <button class="btn btn-whatsapp btn-sm rounded-pill px-3" (click)="shareWhatsapp(bill.id)" title="Share">
                      💬 WhatsApp
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="bills.length === 0">
                <td colspan="4" class="py-5 text-center text-muted">
                  <div class="display-1 opacity-25 mb-3">📂</div>
                  <p class="h5 fw-bold text-secondary">No invoices yet</p>
                  <p class="small">Start recording your sales to see them here.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile View -->
        <div class="d-md-none p-3">
          <div class="card border border-light rounded-4 shadow-sm mb-3" *ngFor="let bill of bills">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge rounded-pill bg-light text-primary border fw-bold">{{ bill.billNumber }}</span>
                <small class="text-muted fw-medium">{{ bill.date | date:'shortDate' }}</small>
              </div>
              <div class="mb-3">
                <div class="fw-bold text-dark fs-6">{{ bill.customer?.name || 'Walk-in' }}</div>
                <div class="fw-extrabold text-primary fs-4 mt-1">₹{{ bill.totalAmount | number:'1.2-2' }}</div>
              </div>
              <div class="d-flex gap-2 border-top pt-3">
                <button class="btn btn-primary flex-grow-1 rounded-pill btn-sm fw-bold" [routerLink]="['/bills', bill.id]">View</button>
                <button class="btn btn-outline-primary rounded-pill btn-sm px-3" (click)="downloadPdf(bill.id)">📄</button>
                <button class="btn btn-whatsapp rounded-pill btn-sm px-3 text-white" (click)="shareWhatsapp(bill.id)">💬</button>
              </div>
            </div>
          </div>
          
          <div class="text-center py-5 text-muted" *ngIf="bills.length === 0">
              <div class="display-3 mb-3 text-opacity-25">📂</div>
              <p class="fw-bold">No Transaction History</p>
          </div>
        </div>

        <!-- Pagination -->
        <div class="card-footer bg-white border-0 py-4 px-4">
          <div class="row align-items-center g-3">
            <div class="col-sm text-center text-sm-start">
              <span class="text-muted small fw-medium">
                Page <span class="text-dark fw-bold">{{ currentPage }}</span> of <span class="text-dark fw-bold">{{ totalPages || 1 }}</span>
              </span>
            </div>
            <div class="col-sm-auto">
              <div class="d-flex gap-2 justify-content-center">
                <button class="btn btn-light btn-sm border rounded-pill px-4 fw-bold" (click)="prevPage()" [disabled]="currentPage === 1">
                  Previous
                </button>
                <button class="btn btn-light btn-sm border rounded-pill px-4 fw-bold" (click)="nextPage()" [disabled]="currentPage === totalPages">
                  Next Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fw-extrabold { font-weight: 800; }
    .extra-small { font-size: 0.75rem; }
    .tracking-wider { letter-spacing: 0.1em; }
    .btn-whatsapp { background: #25d366; color: white; border: none; }
    .btn-whatsapp:hover { background: #128c7e; color: white; }
    .badge { padding: 8px 12px; }
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
