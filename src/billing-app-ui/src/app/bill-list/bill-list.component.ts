import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceService, Bill } from '../invoice.service';
import { AuthService } from '../auth.service';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NotificationService } from '../notification.service';

import { PaymentModalComponent } from '../payment-modal/payment-modal.component';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe, RouterModule, FormsModule],
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
                <th class="py-3 px-4 border-0 text-center">STATUS</th>
                <th class="py-3 px-4 border-0 text-end">TOTAL AMOUNT</th>
                <th class="py-3 px-4 border-0 text-center">QUICK ACTIONS</th>
              </tr>
              <tr class="bg-light border-bottom border-light">
                <th class="py-2 px-3 fw-normal">
                  <div class="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border bg-white">
                     <span class="input-group-text bg-transparent border-0 pe-1 text-muted"><small>🔍</small></span>
                     <input type="text" class="form-control border-0 px-1" placeholder="Filter No..." [(ngModel)]="filters.searchBillNumber" (ngModelChange)="onFilterChange()">
                  </div>
                </th>
                <th class="py-2 px-3 fw-normal">
                  <div class="input-group input-group-sm shadow-sm rounded-pill overflow-hidden border bg-white">
                     <span class="input-group-text bg-transparent border-0 pe-1 text-muted"><small>🔍</small></span>
                     <input type="text" class="form-control border-0 px-1" placeholder="Filter Customer..." [(ngModel)]="filters.searchCustomer" (ngModelChange)="onFilterChange()">
                  </div>
                </th>
                <th class="py-2 px-3 fw-normal text-center">
                  <select class="form-select form-select-sm shadow-sm rounded-pill border bg-white text-center" [(ngModel)]="filters.searchStatus" (ngModelChange)="onFilterChange()">
                    <option value="">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </th>
                <th class="py-2 px-3"></th>
                <th class="py-2 px-3 text-center">
                   <button class="btn btn-sm btn-light rounded-pill border shadow-sm px-3" (click)="clearFilters()" *ngIf="hasActiveFilters()" title="Clear Filters">
                      ❌ Clear
                   </button>
                </th>
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
                <td class="py-3 px-4 text-center">
                  <span class="badge rounded-pill fw-bold" [ngClass]="{'bg-success bg-opacity-10 text-success': bill.status !== 'CANCELLED', 'bg-danger bg-opacity-10 text-danger': bill.status === 'CANCELLED'}">
                    {{ bill.status || 'COMPLETED' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-end fw-extrabold" [ngClass]="bill.status === 'CANCELLED' ? 'text-muted text-decoration-line-through' : 'text-dark fs-5'">
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
                    <button class="btn btn-whatsapp btn-sm rounded-pill d-flex align-items-center gap-2 px-3" (click)="shareWhatsapp(bill.id)" title="Share">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.508.646-.622.779-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                      </svg>
                      WhatsApp
                    </button>
                    <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" *ngIf="bill.status !== 'CANCELLED'" [routerLink]="['/create']" [queryParams]="{ exchangeFrom: bill.id }" title="Exchange Items">
                      🔄 Exchange
                    </button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3" *ngIf="bill.status !== 'CANCELLED'" (click)="cancelBill(bill.id)" title="Cancel Invoice">
                      🚫 Cancel
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
              <div class="mb-3 d-flex justify-content-between align-items-center">
                <div>
                  <div class="fw-bold text-dark fs-6">{{ bill.customer?.name || 'Walk-in' }}</div>
                  <div class="fw-extrabold mt-1" [ngClass]="bill.status === 'CANCELLED' ? 'text-muted text-decoration-line-through' : 'text-primary fs-4'">₹{{ bill.totalAmount | number:'1.2-2' }}</div>
                </div>
                <div>
                  <span class="badge rounded-pill fw-bold" [ngClass]="{'bg-success text-white': bill.status !== 'CANCELLED', 'bg-danger text-white': bill.status === 'CANCELLED'}">
                    {{ bill.status || 'COMPLETED' }}
                  </span>
                </div>
              </div>
              <div class="d-flex gap-2 border-top pt-3 flex-wrap">
                <button class="btn btn-primary flex-grow-1 rounded-pill btn-sm fw-bold" [routerLink]="['/bills', bill.id]">View</button>
                <button class="btn btn-outline-primary rounded-pill btn-sm px-3" (click)="downloadPdf(bill.id)">📄</button>
                <button class="btn btn-whatsapp rounded-pill btn-sm d-flex justify-content-center align-items-center gap-2 px-3 text-white" (click)="shareWhatsapp(bill.id)" title="WhatsApp">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
                     <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.508.646-.622.779-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                   </svg>
                </button>
                <button class="btn btn-outline-secondary flex-grow-1 rounded-pill btn-sm fw-bold mt-1" *ngIf="bill.status !== 'CANCELLED'" [routerLink]="['/create']" [queryParams]="{ exchangeFrom: bill.id }">Exchange</button>
                <button class="btn btn-outline-danger flex-grow-1 rounded-pill btn-sm fw-bold mt-1" *ngIf="bill.status !== 'CANCELLED'" (click)="cancelBill(bill.id)">Cancel</button>
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
  private notificationService = inject(NotificationService);
  bills: any[] = [];
  dashboardStats: any = {};

  // Pagination & Filtering State
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 0;

  filters: any = {
    searchBillNumber: '',
    searchCustomer: '',
    searchStatus: ''
  };

  private filterSubject = new Subject<any>();

  constructor() {
    this.filterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadBills();
    });
  }

  ngOnInit(): void {
    this.loadBills();
    this.loadDashboardStats();
  }

  onFilterChange() {
    this.filterSubject.next({ ...this.filters });
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.searchBillNumber || this.filters.searchCustomer || this.filters.searchStatus);
  }

  clearFilters() {
    this.filters = { searchBillNumber: '', searchCustomer: '', searchStatus: '' };
    this.onFilterChange();
  }

  loadBills() {
    this.invoiceService.getBills(this.currentPage, this.pageSize, this.filters).subscribe({
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

  cancelBill(id: number) {
    this.notificationService.confirm('Are you certain you want to cancel this invoice? This will rollback the stock deductions and zero out the customer ledger balance for this transaction. This action cannot be undone.').then(confirmed => {
      if (confirmed) {
        this.invoiceService.cancelInvoice(id).subscribe({
          next: () => {
            this.notificationService.success('Invoice cancelled successfully. Stock restored.');
            this.loadBills();
            this.loadDashboardStats();
          },
          error: (err) => {
            console.error('Failed to cancel invoice', err);
            this.notificationService.error(err.error?.message || 'Failed to cancel invoice.');
          }
        });
      }
    });
  }
}
