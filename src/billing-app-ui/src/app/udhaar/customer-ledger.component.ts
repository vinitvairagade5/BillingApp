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
    <div class="container-fluid py-4 animate-fade-in">
      <div class="row g-4 align-items-center mb-4">
        <div class="col-auto">
          <button class="btn btn-link link-secondary text-decoration-none fw-bold p-0" routerLink="/udhaar">
            <span class="fs-4">←</span> Back
          </button>
        </div>
        <div class="col">
          <h1 class="h3 fw-bold mb-0">Customer Statement</h1>
        </div>
        <div class="col-auto">
          <div class="card border-0 shadow-sm rounded-4 py-2 px-4 border" 
               [class.bg-danger-subtle]="balance > 0" 
               [class.border-danger]="balance > 0"
               [class.bg-success-subtle]="balance <= 0"
               [class.border-success]="balance <= 0">
            <div class="small fw-bold text-uppercase tracking-wider mb-1" [class.text-danger]="balance > 0" [class.text-success]="balance <= 0">Current Balance</div>
            <div class="h4 fw-extrabold mb-0" [class.text-danger]="balance > 0" [class.text-success]="balance <= 0">₹{{ balance | number:'1.2-2' }}</div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white h-100">
            <div class="card-header bg-light border-0 py-3 px-4">
              <h5 class="mb-0 fw-bold">Transaction History</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr class="text-muted small fw-bold">
                    <th class="py-3 px-4 border-0">DATE</th>
                    <th class="py-3 px-4 border-0">DETAILS</th>
                    <th class="py-3 px-4 border-0 text-end">DEBIT (+)</th>
                    <th class="py-3 px-4 border-0 text-end">CREDIT (-)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of history" class="border-bottom border-light">
                    <td class="py-3 px-4 small text-secondary fw-medium">{{ item.date | date:'shortDate' }}</td>
                    <td class="py-3 px-4">
                      <div class="fw-bold text-dark">{{ item.description }}</div>
                      <div class="text-muted extra-small" *ngIf="item.billId">Bill #{{ item.billId }}</div>
                    </td>
                    <td class="py-3 px-4 text-end">
                      <span class="text-danger fw-bold" *ngIf="item.type === 'DEBIT'">₹{{ item.amount | number:'1.2-2' }}</span>
                    </td>
                    <td class="py-3 px-4 text-end">
                      <span class="text-success fw-bold" *ngIf="item.type === 'CREDIT'">₹{{ item.amount | number:'1.2-2' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="p-5 text-center" *ngIf="history.length === 0">
              <div class="display-1 text-muted opacity-25 mb-3">📄</div>
              <h5 class="text-muted fw-bold">No Transactions</h5>
              <p class="text-secondary mb-0">No entries recorded for this customer yet.</p>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 bg-white p-4">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="fs-4">💰</span>
              <h5 class="mb-0 fw-bold">Record Payment</h5>
            </div>
            <p class="text-muted small mb-4">Received a payment? Record it here to settle the balance.</p>
            
            <form [formGroup]="paymentForm" (ngSubmit)="onRecordPayment()">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted">Amount Received</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0 rounded-start-3">₹</span>
                  <input type="number" formControlName="amount" class="form-control rounded-end-3 p-3 border-start-0 fs-5 fw-bold" placeholder="0.00">
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label small fw-bold text-muted">Description (Optional)</label>
                <input type="text" formControlName="description" class="form-control rounded-3 p-3" placeholder="e.g. Paid in Cash">
              </div>
              
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-primary rounded-pill px-4 fw-bold" (click)="openUpiModal()">
                  📱 UPI
                </button>
                <button type="submit" class="btn btn-primary rounded-pill px-4 flex-grow-1 fw-bold shadow-sm" [disabled]="paymentForm.invalid || loading">
                  <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
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
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fw-extrabold { font-weight: 800; }
    .tracking-wider { letter-spacing: 0.1em; }
    .extra-small { font-size: 0.75rem; }
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
