import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LedgerService, LedgerEntry } from '../ledger.service';

import { PaymentModalComponent } from '../payment-modal/payment-modal.component';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-customer-ledger',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, PaymentModalComponent],
  template: `
    <div class="ledger-page animation-fade-in">
      <header class="page-header">
        <div class="header-left">
           <button class="btn-back" routerLink="/udhaar">← Back</button>
           <h1>Customer Statement</h1>
        </div>
        <div class="header-stats">
          <div class="stat-box" [class.danger]="balance > 0">
             <span class="label">Current Balance</span>
             <span class="value">₹{{ balance | number:'1.2-2' }}</span>
          </div>
        </div>
      </header>

      <div class="ledger-grid">
        <div class="history-section">
          <section class="section glass card">
             <div class="section-header">
                <h3>Transaction History</h3>
             </div>
             <div class="table-container">
               <table class="premium-table">
                 <thead>
                   <tr>
                     <th>Date</th>
                     <th>Details</th>
                     <th class="text-right">Debit (+)</th>
                     <th class="text-right">Credit (-)</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr *ngFor="let item of history">
                     <td>{{ item.date | date:'shortDate' }}</td>
                     <td>
                        <div class="details">
                           <strong>{{ item.description }}</strong>
                           <small *ngIf="item.billId">Bill #{{ item.billId }}</small>
                        </div>
                     </td>
                     <td class="text-right text-danger">{{ item.type === 'DEBIT' ? '₹' + (item.amount | number:'1.2-2') : '' }}</td>
                     <td class="text-right text-success">{{ item.type === 'CREDIT' ? '₹' + (item.amount | number:'1.2-2') : '' }}</td>
                   </tr>
                   <tr *ngIf="history.length === 0">
                      <td colspan="4" class="empty-state">No transactions found for this customer.</td>
                   </tr>
                 </tbody>
               </table>
             </div>
          </section>
        </div>

        <aside class="action-sidebar">
          <section class="section glass card">
             <div class="section-header">
                <span class="icon">💰</span>
                <h3>Record Payment</h3>
             </div>
             <p class="desc">Received a payment from the customer? Add it here to settle the balance.</p>
             
             <form [formGroup]="paymentForm" (ngSubmit)="onRecordPayment()" class="payment-form">
                <div class="form-group">
                   <label>Amount Received</label>
                   <input type="number" formControlName="amount" class="premium-input" placeholder="0.00">
                </div>
                <div class="form-group">
                   <label>Description (Optional)</label>
                   <input type="text" formControlName="description" class="premium-input" placeholder="e.g. Paid in Cash">
                </div>
                
                <div class="btn-group">
                    <button type="button" class="btn btn-secondary" (click)="openUpiModal()" title="Pay via UPI">
                        📱 UPI
                    </button>
                    <button type="submit" class="btn btn-primary btn-block" [disabled]="paymentForm.invalid || loading">
                       {{ loading ? 'Recording...' : 'Record Credit Entry' }}
                    </button>
                </div>
             </form>
          </section>
        </aside>
      </div>
      
      <app-payment-modal
        [isOpen]="isPaymentModalOpen"
        [amount]="paymentAmount"
        [shopUpiId]="shopUpiId"
        [shopName]="shopName"
        (closeEvent)="closePaymentModal()"
        (confirmEvent)="onPaymentConfirmed()"
      ></app-payment-modal>
    </div>
  `,
  styles: [`
    .ledger-page { padding-bottom: 40px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; background: white; padding: 24px 32px; border-radius: 24px; }
    
    .header-left { display: flex; align-items: center; gap: 20px; }
    .btn-back { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; color: #64748b; transition: var(--transition); }
    .btn-back:hover { background: #e2e8f0; color: #0f172a; }
    .page-header h1 { margin: 0; font-size: 28px; }
    
    .stat-box { background: #f1f5f9; padding: 12px 24px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: right; }
    .stat-box .label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .stat-box .value { font-size: 24px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; }
    .stat-box.danger { background: #fee2e2; border-color: #fecaca; color: #b91c1c; }

    .ledger-grid { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; }
    
    .section { padding: 32px; border-radius: 24px; }
    .section-header { margin-bottom: 24px; }
    .section-header h3 { margin: 0; font-size: 20px; }

    .premium-table { width: 100%; border-collapse: collapse; }
    .premium-table th { padding: 16px; border-bottom: 2px solid #f1f5f9; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
    .premium-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }

    .details strong { display: block; color: #1e293b; }
    .details small { color: #94a3b8; }

    .text-danger { color: #dc2626; font-weight: 700; }
    .text-success { color: #16a34a; font-weight: 700; }

    .action-sidebar .desc { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    .payment-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .premium-input { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 15px; }

    .btn-group { display: flex; gap: 10px; }
    .btn-block { flex: 1; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; border: none; }
    .btn-secondary { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; padding: 14px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; }
    .btn-secondary:hover { background: #dbeafe; }
    .btn-primary { background: #2563eb; color: white; transition: var(--transition); }
    .btn-primary:hover { background: #1d4ed8; }
    
    .empty-state { text-align: center; color: #94a3b8; padding: 40px !important; }

    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CustomerLedgerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private ledgerService = inject(LedgerService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  customerId!: number;
  balance = 0;
  history: LedgerEntry[] = [];
  loading = false;

  // UPI State
  isPaymentModalOpen = false;
  shopUpiId = '';
  shopName = '';
  paymentAmount = 0;

  paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    description: ['Payment Received', Validators.required]
  });

  ngOnInit() {
    this.customerId = Number(this.route.snapshot.paramMap.get('customerId'));

    const user = this.authService.currentUserValue;
    if (user) {
      this.shopUpiId = user.upiId || '';
      this.shopName = user.shopName || '';
    }

    this.loadLedger();
  }

  loadLedger() {
    this.ledgerService.getCustomerLedger(this.customerId).subscribe(res => {
      this.balance = res.balance;
      this.history = res.history;
    });
  }

  onRecordPayment() {
    if (this.paymentForm.invalid) return;

    this.loading = true;
    const formValue = this.paymentForm.value;

    const entry: Partial<LedgerEntry> = {
      customerId: this.customerId,
      amount: formValue.amount!,
      description: formValue.description!,
      type: 'CREDIT'
    };

    this.ledgerService.addManualEntry(entry).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.notificationService.success('Payment recorded successfully!');
          this.paymentForm.reset({ amount: 0, description: 'Payment Received' });
          this.loadLedger();
        }
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error('Error: ' + (err.error?.message || 'Failed to record payment'));
      }
    });
  }

  openUpiModal() {
    const amount = this.paymentForm.get('amount')?.value || 0;
    if (amount <= 0) {
      this.notificationService.warning('Please enter a valid amount first.');
      return;
    }
    if (!this.shopUpiId) {
      this.notificationService.warning('Please configure your UPI ID in Settings first.');
      return;
    }

    this.paymentAmount = amount;
    this.isPaymentModalOpen = true;
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
  }

  onPaymentConfirmed() {
    this.isPaymentModalOpen = false;
    // Auto-fill description
    this.paymentForm.patchValue({ description: 'Payment Received via UPI' });
    // Trigger record payment
    this.onRecordPayment();
  }
}
