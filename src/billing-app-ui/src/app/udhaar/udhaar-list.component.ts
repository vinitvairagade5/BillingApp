import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LedgerService, CustomerBalance } from '../ledger.service';

@Component({
  selector: 'app-udhaar-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container-fluid py-4 animate-fade-in">
      <div class="row g-4 align-items-center mb-4">
        <div class="col-md">
          <h1 class="h3 fw-bold mb-1">Udhaar (Credit) Management</h1>
          <p class="text-secondary small mb-0">Track balances and pending payments from customers</p>
        </div>
        <div class="col-md-auto">
          <div class="card border-0 shadow-sm rounded-4 bg-danger bg-opacity-10 py-2 px-4 border border-danger border-opacity-10">
            <div class="text-danger small fw-bold text-uppercase tracking-wider mb-1">Total Pending</div>
            <div class="h4 fw-extrabold text-danger mb-0">₹{{ totalPending | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mt-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr class="text-muted small fw-bold">
                <th class="py-3 px-4 border-0">CUSTOMER</th>
                <th class="py-3 px-4 border-0">MOBILE</th>
                <th class="py-3 px-4 border-0 text-end">BALANCE</th>
                <th class="py-3 px-4 border-0 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of balances" class="border-bottom border-light">
                <td class="py-3 px-4">
                  <div class="d-flex align-items-center gap-3">
                    <div class="rounded-3 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style="width: 40px; height: 40px; font-size: 1.1rem;">
                      {{ item.name.charAt(0) }}
                    </div>
                    <div>
                      <div class="fw-bold text-dark fs-6">{{ item.name }}</div>
                      <div class="text-muted small">Customer ID: #{{ item.customerId }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span class="text-secondary small fw-medium">{{ item.mobile }}</span>
                </td>
                <td class="py-3 px-4 text-end">
                  <span class="fw-extrabold fs-6" [class.text-danger]="item.balance > 0">
                    ₹{{ item.balance | number:'1.2-2' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-center">
                  <button class="btn btn-light border rounded-pill px-4 btn-sm fw-bold text-primary" [routerLink]="['/udhaar', item.customerId]">
                    View Statement
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="p-5 text-center" *ngIf="balances.length === 0 && !loading">
          <div class="display-1 text-muted opacity-25 mb-3">📂</div>
          <h4 class="text-muted fw-bold">No Pending Credit</h4>
          <p class="text-secondary mb-0">Great job! All customer accounts are currently settled.</p>
        </div>

        <div class="p-5 text-center" *ngIf="loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fw-extrabold { font-weight: 800; }
    .tracking-wider { letter-spacing: 0.1em; }
    
    .table-hover tbody tr:hover {
      background-color: rgba(var(--bs-primary-rgb), 0.02);
    }
  `]
})
export class UdhaarListComponent implements OnInit {
  private ledgerService = inject(LedgerService);

  balances: CustomerBalance[] = [];
  loading = false;
  totalPending = 0;

  ngOnInit() {
    this.loadBalances();
  }

  loadBalances() {
    this.loading = true;
    this.ledgerService.getBalances().subscribe({
      next: (data) => {
        this.balances = data;
        this.totalPending = data.reduce((sum, item) => sum + Number(item.balance), 0);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
