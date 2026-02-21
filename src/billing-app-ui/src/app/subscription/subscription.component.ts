import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubscriptionService } from '../subscription.service';
import { AuthService, User } from '../auth.service';
import { InvoiceService } from '../invoice.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid py-4 animate-fade-in">
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Plans & Billing</h1>
          <p class="text-secondary small mb-0">Manage your subscription, activate licenses, and track referral rewards</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <!-- Current Plan Card -->
          <div class="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden" 
               [class.border-primary]="isPro" [class.border-top]="isPro" style="border-width: 4px !important;">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-start mb-4">
                <div>
                  <span class="badge rounded-pill mb-2 px-3 py-2" 
                        [class.bg-primary-subtle]="isPro" [class.text-primary]="isPro"
                        [class.bg-secondary-subtle]="!isPro" [class.text-secondary]="!isPro">
                    {{ isPro ? 'PRO PLAN' : 'FREE PLAN' }}
                  </span>
                  <h2 class="h4 fw-bold mb-1" *ngIf="!isPro">Free Subscription</h2>
                  <h2 class="h4 fw-bold mb-1 text-primary" *ngIf="isPro">Pro Subscription Active 🚀</h2>
                  <p class="text-muted small mb-0" *ngIf="isPro && user?.subscriptionExpiry">
                    Valid until: <span class="fw-bold text-dark">{{ user?.subscriptionExpiry | date:'mediumDate' }}</span>
                  </p>
                </div>
                <div class="display-4">{{ isPro ? '🚀' : '🌱' }}</div>
              </div>

              <div class="p-3 bg-light rounded-3" *ngIf="!isPro">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="small fw-bold text-muted text-uppercase tracking-wider">Usage Progress</span>
                  <span class="small fw-bold">{{ invoiceCount }}/10 Invoices</span>
                </div>
                <div class="progress rounded-pill mb-2" style="height: 10px;">
                  <div class="progress-bar progress-bar-striped progress-bar-animated rounded-pill" 
                       role="progressbar" [style.width.%]="(invoiceCount / 10) * 100"></div>
                </div>
                <p class="small text-secondary mb-0 mt-2">
                  <span class="text-primary fw-bold">Upgrade to PRO</span> to unlock unlimited invoices and advanced features.
                </p>
              </div>
            </div>
          </div>

          <!-- Activation & Referrals -->
          <div class="row g-4">
            <!-- License Activation -->
            <div class="col-md-6">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4">
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <span class="fs-4">🔑</span>
                    <h5 class="mb-0 fw-bold">Activate License</h5>
                  </div>
                  <p class="text-muted small mb-4">Enter your 16-digit license key to upgrade instantly.</p>
                  
                  <form [formGroup]="redeemForm" (ngSubmit)="onRedeem()">
                    <div class="mb-3">
                      <input type="text" formControlName="code" 
                             class="form-control form-control-lg rounded-3 border-light-subtle shadow-none bg-light" 
                             placeholder="XXXX-XXXX-XXXX-XXXX" style="letter-spacing: 1px; font-family: monospace;">
                    </div>
                    <button type="submit" class="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm" 
                            [disabled]="redeemForm.invalid || loading">
                      <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                      {{ loading ? 'Verifying...' : 'Upgrade Account' }}
                    </button>
                    <div class="alert alert-danger mt-3 py-2 small border-0" *ngIf="errorMessage">{{ errorMessage }}</div>
                    <div class="alert alert-success mt-3 py-2 small border-0" *ngIf="successMessage">{{ successMessage }}</div>
                  </form>
                </div>
              </div>
            </div>

            <!-- Referral Link -->
            <div class="col-md-6">
              <div class="card border-0 shadow-sm rounded-4 h-100">
                <div class="card-body p-4">
                  <div class="d-flex align-items-center gap-2 mb-3">
                    <span class="fs-4">🎁</span>
                    <h5 class="mb-0 fw-bold">Refer & Earn</h5>
                  </div>
                  <p class="text-muted small mb-4">Invite others and both get <span class="text-success fw-bold">7 days of PRO</span> free!</p>
                  
                  <div class="bg-light p-3 rounded-3 mb-3 border border-light-subtle">
                    <div class="small fw-bold text-muted text-uppercase mb-2 tracking-wider">Your Referral Link</div>
                    <div class="d-flex align-items-center gap-2">
                      <code class="flex-grow-1 text-truncate fw-bold text-primary">{{ user?.referralCode || 'GENERATING...' }}</code>
                      <button class="btn btn-white btn-sm border shadow-sm rounded-pill px-3" (click)="copyReferralLink()">Copy</button>
                    </div>
                  </div>
                  <button class="btn btn-outline-primary w-100 rounded-pill py-3 fw-bold" (click)="copyCode()">
                    Copy Promo Code
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Referral Performance -->
          <div class="card border-0 shadow-sm rounded-4 mt-4 overflow-hidden" *ngIf="referralStats">
            <div class="card-header bg-white border-0 py-4 px-4">
              <h5 class="mb-0 fw-bold">Referral Performance</h5>
            </div>
            <div class="card-body p-4 pt-0">
              <div class="row g-3 mb-4">
                <div class="col-4">
                  <div class="p-3 bg-primary-subtle rounded-4 text-center border border-primary-subtle">
                    <div class="h3 fw-extrabold text-primary mb-0">{{ referralStats.totalReferrals }}</div>
                    <div class="extra-small fw-bold text-primary text-uppercase mt-1">Total</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="p-3 bg-success-subtle rounded-4 text-center border border-success-subtle">
                    <div class="h3 fw-extrabold text-success mb-0">{{ referralStats.activeProReferrals }}</div>
                    <div class="extra-small fw-bold text-success text-uppercase mt-1">Active Pro</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="p-3 bg-warning-subtle rounded-4 text-center border border-warning-subtle">
                    <div class="h3 fw-extrabold text-warning-emphasis mb-0">{{ referralStats.bonusDaysEarned }}</div>
                    <div class="extra-small fw-bold text-warning-emphasis text-uppercase mt-1">Bonus Days</div>
                  </div>
                </div>
              </div>

              <!-- Referral List -->
              <div *ngIf="referralStats.recentReferrals?.length > 0">
                <h6 class="small fw-extrabold text-muted text-uppercase tracking-wider mb-3">Recent Referrals</h6>
                <div class="list-group list-group-flush border rounded-4 overflow-hidden">
                  <div class="list-group-item p-3 border-light" *ngFor="let ref of referralStats.recentReferrals">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <div class="fw-bold text-dark">{{ ref.shopName }}</div>
                        <div class="extra-small text-muted">{{ '@' + ref.username }}</div>
                      </div>
                      <div class="text-end">
                        <span class="badge rounded-pill px-2 py-1 mb-1" 
                              [class.bg-primary]="ref.isPro" [class.bg-light]="!ref.isPro" 
                              [class.text-dark]="!ref.isPro">
                          {{ ref.isPro ? 'PRO' : 'FREE' }}
                        </span>
                        <div class="extra-small text-muted">{{ ref.createdAt | date:'shortDate' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-center py-4" *ngIf="!referralStats.recentReferrals || referralStats.recentReferrals.length === 0">
                <div class="display-1 text-muted opacity-10 mb-2">🎁</div>
                <p class="text-muted small mb-0">No referrals yet. Share your code to earn rewards!</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Benefits Card -->
          <div class="card border-0 shadow-sm rounded-4 bg-primary text-white p-4">
            <h5 class="fw-bold mb-4 d-flex align-items-center gap-2">
              <span>💎</span> Pro Benefits
            </h5>
            <ul class="list-unstyled mb-0">
              <li class="d-flex gap-3 mb-3">
                <span class="opacity-75">✔</span>
                <span class="small fw-medium">Unlimited GST Invoices</span>
              </li>
              <li class="d-flex gap-3 mb-3">
                <span class="opacity-75">✔</span>
                <span class="small fw-medium">Custom Shop Logo Branding</span>
              </li>
              <li class="d-flex gap-3 mb-3">
                <span class="opacity-75">✔</span>
                <span class="small fw-medium">Advanced Inventory Tracking</span>
              </li>
              <li class="d-flex gap-3 mb-3">
                <span class="opacity-75">✔</span>
                <span class="small fw-medium">WhatsApp Direct Sharing</span>
              </li>
              <li class="d-flex gap-3 mb-3">
                <span class="opacity-75">✔</span>
                <span class="small fw-medium">Priority Customer Support</span>
              </li>
              <li class="d-flex gap-3">
                <span class="opacity-75">✔</span>
                <span class="small fw-medium">Bulk Excel Data Exports</span>
              </li>
            </ul>
          </div>

          <!-- Why Referral? -->
          <div class="card border-0 shadow-sm rounded-4 mt-4 p-4 border border-primary-subtle bg-primary-subtle-light">
             <h6 class="fw-bold text-primary mb-3">Why Refer?</h6>
             <p class="small text-secondary mb-0">
               We grow when you grow. Share BillPro with your friends and help them modernize their business. 
               For every successful referral, we add <span class="badge bg-success">7 EXTRA DAYS</span> to your subscription!
             </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tracking-wider { letter-spacing: 0.1em; }
    .bg-light { background-color: #f8fafc !important; }
    .bg-primary-subtle-light { background-color: rgba(13, 110, 253, 0.03); }
    .extra-small { font-size: 0.75rem; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SubscriptionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private subService = inject(SubscriptionService);
  private authService = inject(AuthService);
  private invoiceService = inject(InvoiceService);
  private notificationService = inject(NotificationService);

  user: User | null = null;
  invoiceCount = 0;
  loading = false;
  errorMessage = '';
  successMessage = '';
  referralStats: any = null;

  redeemForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(4)]]
  });

  get isPro(): boolean {
    if (!this.user?.subscriptionType) return false;
    if (this.user.subscriptionType !== 'PRO') return false;
    if (!this.user.subscriptionExpiry) return false;
    return new Date(this.user.subscriptionExpiry) > new Date();
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => this.user = u);

    // Refresh profile to get latest referral rewards
    this.authService.refreshProfile().subscribe();

    // Refresh referral code if missing
    if (this.user && !this.user.referralCode) {
      this.subService.getReferralCode().subscribe(res => {
        if (this.user) {
          this.user.referralCode = res.code;
        }
      });
    }

    // Fetch usage stats
    this.invoiceService.getDashboardStats().subscribe(stats => {
      this.invoiceCount = stats.totalInvoices || 0;
    });

    // Fetch referral stats
    this.subService.getReferralStats().subscribe(stats => {
      this.referralStats = stats;
    });
  }

  onRedeem() {
    if (this.redeemForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const code = this.redeemForm.get('code')?.value!;

    this.subService.redeemCode(code).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage = res.message || 'Upgrade successful!';
          this.redeemForm.reset();

          // Fetch latest profile info to update local state (handles subscription status update)
          this.authService.refreshProfile().subscribe(() => {
            this.loading = false;
            this.notificationService.success(this.successMessage);
          });
        } else {
          this.loading = false;
          this.errorMessage = res.message || 'Invalid code';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to redeem code. Please try again.';
      }
    });
  }

  copyCode() {
    if (this.user?.referralCode) {
      navigator.clipboard.writeText(this.user.referralCode);
      this.notificationService.success('Referral code copied to clipboard!');
    }
  }

  copyReferralLink() {
    if (this.user?.referralCode) {
      const baseUrl = window.location.origin;
      const referralLink = `${baseUrl}/login?ref=${this.user.referralCode}`;
      navigator.clipboard.writeText(referralLink);
      this.notificationService.success('Referral link copied to clipboard!');
    }
  }
}
