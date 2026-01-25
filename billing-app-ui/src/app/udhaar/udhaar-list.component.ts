import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LedgerService, CustomerBalance } from '../ledger.service';

@Component({
    selector: 'app-udhaar-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="udhaar-page animation-fade-in">
      <header class="page-header">
        <div>
          <h1>Udhaar (Credit) Management</h1>
          <p class="subtitle">Track balances and pending payments from customers</p>
        </div>
        <div class="header-stats">
          <div class="stat-box">
             <span class="label">Total Pending</span>
             <span class="value text-danger">₹{{ totalPending | number:'1.2-2' }}</span>
          </div>
        </div>
      </header>

      <section class="section glass card">
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Mobile</th>
                <th class="text-right">Balance</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of balances">
                <td>
                   <div class="cust-info">
                      <div class="avatar">{{ item.name.charAt(0) }}</div>
                      <strong>{{ item.name }}</strong>
                   </div>
                </td>
                <td>{{ item.mobile }}</td>
                <td class="text-right">
                   <span class="balance-tag" [class.negative]="item.balance > 0">
                      ₹{{ item.balance | number:'1.2-2' }}
                   </span>
                </td>
                <td class="text-center">
                   <button class="btn btn-primary sm" [routerLink]="['/udhaar', item.customerId]">
                      Statement
                   </button>
                </td>
              </tr>
              <tr *ngIf="balances.length === 0 && !loading">
                 <td colspan="4" class="empty-state">No pending credit balances found.</td>
              </tr>
              <tr *ngIf="loading">
                 <td colspan="4" class="empty-state">Loading balances...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
    styles: [`
    .udhaar-page { padding-bottom: 40px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; background: white; padding: 24px 32px; border-radius: 24px; }
    .page-header h1 { margin: 0; font-size: 32px; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }
    
    .header-stats { display: flex; gap: 24px; }
    .stat-box { background: #fee2e2; padding: 12px 24px; border-radius: 16px; border: 1px solid #fecaca; }
    .stat-box .label { display: block; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; }
    .stat-box .value { font-size: 24px; font-weight: 800; }

    .section { padding: 0; border-radius: 24px; overflow: hidden; }
    .table-container { overflow-x: auto; }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 20px; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
    .premium-table td { padding: 20px; font-size: 15px; border-bottom: 1px solid #f1f5f9; background: white; }

    .cust-info { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 32px; height: 32px; background: #eff6ff; color: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }

    .balance-tag { font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; }
    .balance-tag.negative { color: #dc2626; }

    .btn-primary.sm { padding: 8px 16px; font-size: 13px; border-radius: 10px; }

    .empty-state { text-align: center; color: #94a3b8; padding: 60px !important; }

    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
