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
    <div class="subscription-page animation-fade-in">
      <header class="page-header">
        <div>
          <h1>Plans & Billing</h1>
          <p class="subtitle">Manage your subscription and referral rewards</p>
        </div>
      </header>

      <div class="subscription-grid">
        <div class="main-content">
          <!-- Current Plan Card -->
          <section class="section glass card plan-status-card" [class.pro]="isPro">
            <div class="plan-info">
              <div class="plan-badge">{{ isPro ? 'PRO PLAN' : 'FREE PLAN' }}</div>
              <h2 *ngIf="!isPro">You are currently on the Free Plan</h2>
              <h2 *ngIf="isPro">Your Pro Subscription is Active!</h2>
              
              <p class="expiry-text" *ngIf="isPro && user?.subscriptionExpiry">
                Valid until: {{ user?.subscriptionExpiry | date:'mediumDate' }}
              </p>
              
              <div class="limits-info" *ngIf="!isPro">
                <div class="limit-item">
                  <span class="limit-label">Invoice Limit:</span>
                  <span class="limit-value">{{ invoiceCount }} / 10 Invoices used</span>
                </div>
                <div class="progress-bar">
                   <div class="progress" [style.width.%]="(invoiceCount / 10) * 100"></div>
                </div>
                <p class="helper">Upgrade to PRO for unlimited invoices and priority support.</p>
              </div>
            </div>
            <div class="plan-icon">{{ isPro ? '🚀' : '🌱' }}</div>
          </section>

          <!-- Redemption Section -->
          <section class="section glass card mt-4">
            <div class="section-header">
              <span class="step-num">🔑</span>
              <h3>Redeem Activation Code</h3>
            </div>
            <p class="section-desc">Enter your 16-digit license key or activation code to upgrade your account.</p>
            
            <form [formGroup]="redeemForm" (ngSubmit)="onRedeem()" class="redeem-form">
              <div class="input-group">
                <input type="text" formControlName="code" class="premium-input" placeholder="XXXX-XXXX-XXXX-XXXX">
                <button type="submit" class="btn btn-primary" [disabled]="redeemForm.invalid || loading">
                   {{ loading ? 'Verifying...' : 'Upgrade Now' }}
                </button>
              </div>
              <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>
              <div class="success-msg" *ngIf="successMessage">{{ successMessage }}</div>
            </form>
          </section>

          <!-- Referral Section -->
          <section class="section glass card mt-4">
            <div class="section-header">
              <span class="step-num">🎁</span>
              <h3>Refer & Earn</h3>
            </div>
            <p class="section-desc">Invite other shop owners. When they sign up using your link, both of you get <b>7 days of PRO</b> for free!</p>
            
            <div class="referral-box">
               <div class="code-display">
                  <label>Your Referral Code</label>
                  <div class="copy-field">
                     <span class="code">{{ user?.referralCode || 'GENERATING...' }}</span>
                     <button class="btn btn-secondary sm" (click)="copyReferralLink()">Copy Link</button>
                     <button class="btn btn-secondary sm" (click)="copyCode()">Copy Code</button>
                  </div>
               </div>
            </div>

            <!-- Referral Statistics -->
            <div class="referral-stats" *ngIf="referralStats">
              <h4 class="stats-title">Your Referral Performance</h4>
              <div class="stats-grid-mini">
                <div class="stat-mini">
                  <div class="stat-icon-mini">👥</div>
                  <div class="stat-content">
                    <div class="stat-value-mini">{{ referralStats.totalReferrals }}</div>
                    <div class="stat-label-mini">Total Referrals</div>
                  </div>
                </div>
                <div class="stat-mini">
                  <div class="stat-icon-mini">⭐</div>
                  <div class="stat-content">
                    <div class="stat-value-mini">{{ referralStats.activeProReferrals }}</div>
                    <div class="stat-label-mini">Active PRO Users</div>
                  </div>
                </div>
                <div class="stat-mini">
                  <div class="stat-icon-mini">🎁</div>
                  <div class="stat-content">
                    <div class="stat-value-mini">{{ referralStats.bonusDaysEarned }}</div>
                    <div class="stat-label-mini">Bonus Days Earned</div>
                  </div>
                </div>
              </div>

              <!-- Recent Referrals Table -->
              <div class="recent-referrals" *ngIf="referralStats.recentReferrals?.length > 0">
                <h5 class="referrals-subtitle">Recent Referrals</h5>
                <div class="referrals-table">
                  <div class="referral-row" *ngFor="let ref of referralStats.recentReferrals">
                    <div class="referral-info">
                      <div class="referral-name">{{ ref.shopName }}</div>
                      <div class="referral-username">{{ '@' + ref.username }}</div>
                    </div>
                    <div class="referral-status">
                      <span class="status-badge" [class.pro]="ref.isPro">
                        {{ ref.isPro ? 'PRO' : 'FREE' }}
                      </span>
                      <div class="referral-date">{{ ref.createdAt | date:'shortDate' }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="no-referrals" *ngIf="!referralStats.recentReferrals || referralStats.recentReferrals.length === 0">
                <p>No referrals yet. Start sharing your code to earn rewards!</p>
              </div>
            </div>
          </section>
        </div>

        <aside class="sidebar-info">
           <div class="card glass pro-features">
              <h3>Pro Features</h3>
              <ul class="feature-list">
                 <li>✅ Unlimited GST Invoices</li>
                 <li>✅ Custom Shop Logo</li>
                 <li>✅ Udhaar (Credit) Management</li>
                 <li>✅ WhatsApp Direct Sharing</li>
                 <li>✅ Excel Data Exports</li>
              </ul>
           </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .subscription-page { padding-bottom: 40px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { margin: 0; font-size: 32px; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }

    .subscription-grid { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
    
    .section { padding: 32px; border-radius: 24px; position: relative; overflow: hidden; }
    .mt-4 { margin-top: 24px; }
    
    .plan-status-card { display: flex; justify-content: space-between; align-items: center; background: white; border: 1px solid var(--border-color); }
    .plan-status-card.pro { background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%); border: 2px solid var(--primary); }
    
    .plan-badge { display: inline-block; padding: 6px 12px; border-radius: 100px; font-size: 12px; font-weight: 800; background: #f1f5f9; color: #64748b; margin-bottom: 16px; }
    .pro .plan-badge { background: var(--primary); color: white; }
    
    .plan-info h2 { margin: 0; font-size: 24px; color: #0f172a; }
    .expiry-text { margin-top: 8px; color: var(--primary); font-weight: 600; font-size: 14px; }
    
    .plan-icon { font-size: 64px; opacity: 0.8; }
    
    .limits-info { margin-top: 24px; }
    .limit-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 600; }
    .progress-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 12px; }
    .progress { height: 100%; background: var(--primary); border-radius: 4px; }
    .helper { font-size: 12px; color: #64748b; }

    .section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .step-num { font-size: 24px; }
    .section-desc { color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }

    .input-group { display: flex; gap: 12px; }
    .premium-input { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; font-size: 15px; transition: var(--transition); }
    .premium-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px var(--primary-glow); }

    .referral-box { background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px dashed #cbd5e1; }
    .code-display label { display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; }
    .copy-field { display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 8px 8px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .code { font-family: 'Courier New', Courier, monospace; font-weight: 800; font-size: 20px; letter-spacing: 2px; color: #0f172a; }

    .pro-features { padding: 24px; }
    .feature-list { list-style: none; padding: 0; margin: 16px 0 0 0; display: flex; flex-direction: column; gap: 14px; }
    .feature-list li { font-size: 14px; font-weight: 500; color: #475569; }

    .error-msg { color: var(--danger); font-size: 14px; font-weight: 600; margin-top: 12px; }
    .success-msg { color: var(--success); font-size: 14px; font-weight: 600; margin-top: 12px; }

    /* Referral Statistics */
    .referral-stats { margin-top: 32px; padding-top: 32px; border-top: 2px dashed #e2e8f0; }
    .stats-title { margin: 0 0 20px 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    
    .stats-grid-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-mini { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; transition: var(--transition); }
    .stat-mini:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
    .stat-icon-mini { font-size: 28px; }
    .stat-content { flex: 1; }
    .stat-value-mini { font-size: 24px; font-weight: 800; color: var(--primary); margin-bottom: 4px; }
    .stat-label-mini { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }

    .referrals-subtitle { margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .referrals-table { background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .referral-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; transition: var(--transition); }
    .referral-row:last-child { border-bottom: none; }
    .referral-row:hover { background: #f8fafc; }
    
    .referral-info { flex: 1; }
    .referral-name { font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .referral-username { font-size: 13px; color: #64748b; }
    
    .referral-status { display: flex; align-items: center; gap: 12px; }
    .status-badge { padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 800; background: #f1f5f9; color: #64748b; letter-spacing: 0.5px; }
    .status-badge.pro { background: var(--primary); color: white; }
    .referral-date { font-size: 12px; color: #94a3b8; }

    .no-referrals { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; }

    @media (max-width: 768px) {
      .stats-grid-mini { grid-template-columns: 1fr; }
      .referral-row { flex-direction: column; align-items: flex-start; gap: 12px; }
      .referral-status { width: 100%; justify-content: space-between; }
    }

    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
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
