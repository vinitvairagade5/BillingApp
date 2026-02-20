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
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Admin Dashboard</h1>
          <p class="text-secondary small mb-0">System-wide license management and activation controls</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Generator Section -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-light">
            <div class="d-flex align-items-center gap-2 mb-4">
              <span class="fs-4">🎟️</span>
              <h5 class="mb-0 fw-bold">Generate Keys</h5>
            </div>
            
            <form [formGroup]="genForm" (ngSubmit)="onGenerate()">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Number of Codes</label>
                <input type="number" formControlName="count" class="form-control rounded-3 p-3 shadow-none fw-bold" min="1" max="50">
              </div>
              <div class="mb-4">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">Plan Duration</label>
                <select formControlName="durationDays" class="form-select rounded-3 p-3 shadow-none fw-bold">
                  <option [value]="30">30 Days (Standard)</option>
                  <option [value]="90">90 Days (Quarterly)</option>
                  <option [value]="180">180 Days (Half-Year)</option>
                  <option [value]="365">365 Days (Yearly)</option>
                </select>
              </div>
              
              <button type="submit" class="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm" [disabled]="genForm.invalid || loading">
                <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ loading ? 'Generating...' : 'Create New License Keys' }}
              </button>
            </form>
            
            <div class="alert alert-info border-0 rounded-3 d-flex align-items-start gap-3 mt-4 mb-0">
              <span class="fs-5">ℹ️</span>
              <p class="extra-small mb-0 fw-medium">Generated keys can be manually distributed for offline sales or promotional activities.</p>
            </div>
          </div>
        </div>

        <!-- Codes History -->
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white h-100">
            <div class="card-header bg-light border-0 py-3 px-4">
              <h5 class="mb-0 fw-bold">Active License Inventory</h5>
            </div>
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr class="text-muted extra-small fw-bold text-uppercase">
                    <th class="py-3 px-4 border-0">LICENSE CODE</th>
                    <th class="py-3 px-4 border-0">DURATION</th>
                    <th class="py-3 px-4 border-0">STATUS</th>
                    <th class="py-3 px-4 border-0">CREATED</th>
                    <th class="py-3 px-4 border-0">USER ID</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let code of codes" class="border-bottom border-light">
                    <td class="py-3 px-4">
                      <span class="badge bg-light text-primary border fw-bold font-monospace fs-6 px-3">
                        {{ code.code }}
                      </span>
                    </td>
                    <td class="py-3 px-4 fw-medium text-dark">{{ code.durationDays }} Days</td>
                    <td class="py-3 px-4">
                      <span class="badge rounded-pill fw-bold" 
                            [class.bg-success-subtle]="!code.isRedeemed" 
                            [class.text-success]="!code.isRedeemed"
                            [class.bg-secondary-subtle]="code.isRedeemed"
                            [class.text-secondary]="code.isRedeemed">
                        {{ code.isRedeemed ? 'Redeemed' : 'Available' }}
                      </span>
                    </td>
                    <td class="py-3 px-4 small text-muted">{{ code.createdAt | date:'shortDate' }}</td>
                    <td class="py-3 px-4">
                      <code class="text-secondary small">{{ code.redeemedByUserId || '-' }}</code>
                    </td>
                  </tr>
                  <tr *ngIf="codes.length === 0">
                    <td colspan="5" class="text-center py-5 text-muted">
                      <div class="display-1 opacity-25 mb-3">🗝️</div>
                      <p class="fw-bold fs-5">No license keys yet</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .extra-small { font-size: 0.75rem; }
    .tracking-wider { letter-spacing: 0.1em; }
    .font-monospace { font-family: 'JetBrains Mono', 'Fira Code', monospace !important; }
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
