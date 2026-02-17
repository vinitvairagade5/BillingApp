import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService, ActivationCode } from '../admin.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-page animation-fade-in">
      <header class="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p class="subtitle">System-wide management and activation codes</p>
        </div>
      </header>

      <div class="admin-grid">
        <section class="section glass card">
          <div class="section-header">
             <span class="icon">🎟️</span>
             <h3>Generate Activation Codes</h3>
          </div>
          <p class="section-desc">Create new license keys for manual sales or promotions.</p>

          <form [formGroup]="genForm" (ngSubmit)="onGenerate()" class="gen-form">
             <div class="form-row">
               <div class="form-group">
                 <label>Number of Codes</label>
                 <input type="number" formControlName="count" class="premium-input" min="1" max="50">
               </div>
               <div class="form-group">
                 <label>Duration (Days)</label>
                 <select formControlName="durationDays" class="premium-input">
                   <option [value]="30">30 Days (1 Month)</option>
                   <option [value]="90">90 Days (3 Months)</option>
                   <option [value]="180">180 Days (6 Months)</option>
                   <option [value]="365">365 Days (1 Year)</option>
                 </select>
               </div>
             </div>
             <button type="submit" class="btn btn-primary mt-4" [disabled]="genForm.invalid || loading">
               {{ loading ? 'Generating...' : 'Generate New Keys' }}
             </button>
          </form>
        </section>

        <section class="section glass card mt-4">
          <div class="section-header">
             <span class="icon">📜</span>
             <h3>Active License Keys</h3>
          </div>
          <div class="table-container">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Redeemed By</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let code of codes">
                  <td class="code-cell">{{ code.code }}</td>
                  <td>{{ code.durationDays }} Days</td>
                  <td>
                    <span class="status-badge" [class.redeemed]="code.isRedeemed">
                      {{ code.isRedeemed ? 'Redeemed' : 'Active' }}
                    </span>
                  </td>
                  <td>{{ code.createdAt | date:'shortDate' }}</td>
                  <td>{{ code.redeemedByUserId || '-' }}</td>
                </tr>
                <tr *ngIf="codes.length === 0">
                   <td colspan="5" class="empty-state">No activation codes found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { padding-bottom: 40px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { margin: 0; font-size: 32px; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }

    .section { padding: 32px; border-radius: 24px; }
    .mt-4 { margin-top: 24px; }

    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .section-header .icon { font-size: 24px; }
    .section-header h3 { margin: 0; font-size: 20px; color: #0f172a; }
    
    .section-desc { color: #64748b; font-size: 14px; margin-bottom: 24px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; }

    .premium-input { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 15px; }

    .table-container { overflow-x: auto; margin-top: 16px; }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 16px; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
    .premium-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }

    .code-cell { font-family: monospace; font-weight: 700; color: var(--primary); }
    
    .status-badge { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #166534; }
    .status-badge.redeemed { background: #f1f5f9; color: #64748b; }

    .empty-state { text-align: center; color: #94a3b8; padding: 40px !important; }

    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  codes: ActivationCode[] = [];
  loading = false;

  genForm = this.fb.group({
    count: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
    durationDays: [365, [Validators.required]]
  });

  ngOnInit() {
    this.loadCodes();
  }

  loadCodes() {
    this.adminService.getAllCodes().subscribe(res => {
      this.codes = res;
    });
  }

  onGenerate() {
    if (this.genForm.invalid) return;

    this.loading = true;
    const { count, durationDays } = this.genForm.value;

    this.adminService.generateCodes(count!, durationDays!).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.notificationService.success('Codes generated successfully!');
          this.loadCodes();
        }
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error('Failed to generate codes: ' + (err.error?.message || err.message));
      }
    });
  }
}
