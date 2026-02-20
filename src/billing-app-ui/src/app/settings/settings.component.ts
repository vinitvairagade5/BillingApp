import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../auth.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Settings</h1>
          <p class="text-secondary small mb-0">Manage your shop profile, security, and tax preferences</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div class="card-header bg-light border-0 py-3 px-4 d-flex align-items-center gap-2">
              <span class="fs-5">🏠</span>
              <h5 class="mb-0 fw-bold">Shop Profile</h5>
            </div>
            <div class="card-body p-4">
              <form [formGroup]="profileForm" (ngSubmit)="onSave()">
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-muted">Shop Name</label>
                    <input type="text" formControlName="shopName" class="form-control rounded-3 p-3">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-muted">GSTIN (Optional)</label>
                    <input type="text" formControlName="gstin" class="form-control rounded-3 p-3" placeholder="e.g. 07AAAAA0000A1Z5">
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label small fw-bold text-muted">Business Address</label>
                  <textarea formControlName="address" class="form-control rounded-3 p-3" rows="3"></textarea>
                </div>

                <div class="mb-4">
                  <label class="form-label small fw-bold text-muted">UPI ID (for Payments)</label>
                  <input type="text" formControlName="upiId" class="form-control rounded-3 p-3" placeholder="e.g. yourshop@okicici">
                  <p class="form-text small text-muted">Customers will scan a QR code generated from this ID to pay you directly.</p>
                </div>

                <div class="mb-4">
                  <label class="form-label small fw-bold text-muted">Logo URL</label>
                  <input type="text" formControlName="logoUrl" class="form-control rounded-3 p-3" placeholder="https://example.com/logo.png">
                  <p class="form-text small text-muted">Enter a direct link to your shop logo (PNG/JPG recommended).</p>
                </div>

                <div class="text-end">
                  <button type="submit" class="btn btn-primary rounded-pill px-5 py-2 fw-bold" [disabled]="profileForm.invalid || loading">
                    <span *ngIf="!loading">Save Changes</span>
                    <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                    <span *ngIf="loading">Saving...</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
            <div class="card-header bg-light border-0 py-3 px-4 d-flex align-items-center gap-2">
              <span class="fs-5">🔒</span>
              <h5 class="mb-0 fw-bold">Security / Change Password</h5>
            </div>
            <div class="card-body p-4">
              <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Current Password</label>
                  <input type="password" formControlName="currentPassword" class="form-control rounded-3 p-3" placeholder="••••••">
                </div>
                
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-muted">New Password</label>
                    <input type="password" formControlName="newPassword" class="form-control rounded-3 p-3" placeholder="•••••• (min 6 chars)">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label small fw-bold text-muted">Confirm New Password</label>
                    <input type="password" formControlName="confirmPassword" class="form-control rounded-3 p-3" placeholder="••••••">
                  </div>
                </div>
                
                <div class="alert alert-danger border-0 p-2 small mb-3 animate-fade-in" *ngIf="passwordForm.errors?.['mismatch'] && passwordForm.get('confirmPassword')?.touched">
                   Passwords do not match
                </div>

                <div class="text-end">
                  <button type="submit" class="btn btn-primary rounded-pill px-5 py-2 fw-bold" [disabled]="passwordForm.invalid || loading">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-light border-0 py-3 px-4 d-flex align-items-center gap-2">
              <span class="fs-5">🧾</span>
              <h5 class="mb-0 fw-bold">GST Rate Configuration</h5>
            </div>
            <div class="card-body p-4">
              <p class="text-muted small mb-4">Add or remove the GST rate percentages available during invoice creation.</p>
              
              <div class="d-flex flex-wrap gap-2 mb-4">
                <div *ngFor="let rate of gstRatesArray; let i = index" class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill p-2 ps-3 d-flex align-items-center gap-2">
                  <span class="fw-bold">{{ rate }}%</span>
                  <button type="button" class="btn-close btn-close-white" style="font-size: 0.5rem;" (click)="removeGstRate(i)" aria-label="Remove"></button>
                </div>
              </div>
              
              <div class="row g-2 align-items-center mb-4">
                <div class="col-auto">
                  <input type="number" #newRateInput placeholder="New Rate (e.g. 15)" class="form-control rounded-pill px-3 py-2">
                </div>
                <div class="col-auto">
                  <button type="button" class="btn btn-light rounded-pill px-4 border" (click)="addGstRate(newRateInput.value); newRateInput.value=''">Add Rate</button>
                </div>
              </div>
              
              <div class="border-top pt-4 text-end">
                <button type="button" class="btn btn-primary rounded-pill px-5 py-2 fw-bold" (click)="saveGstRates()" [disabled]="loading">
                  Save GST Rates
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 text-center p-4">
            <h5 class="fw-bold text-dark mb-4">Logo Preview</h5>
            <div class="mx-auto rounded-4 border d-flex align-items-center justify-content-center bg-light overflow-hidden mb-3" style="width: 180px; height: 180px;">
              <img [src]="profileForm.get('logoUrl')?.value || 'https://via.placeholder.com/180?text=No+Logo'" 
                   class="img-fluid" style="max-height: 100%; object-fit: contain;" alt="Logo Preview">
            </div>
            <p class="text-secondary small">This logo will appear on your generated PDF invoices for a professional look.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .form-control:focus {
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
      border-color: #0d6efd;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  loading = false;
  gstRatesArray: number[] = [0, 5, 12, 18, 28];

  profileForm = this.fb.group({
    shopName: ['', Validators.required],
    gstin: [''],
    address: [''],
    logoUrl: [''],
    upiId: ['']
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(g: any) {
    return g.get('newPassword').value === g.get('confirmPassword').value
      ? null : { 'mismatch': true };
  }

  ngOnInit() {
    const user = this.authService.currentUserValue;
    if (user) {
      this.profileForm.patchValue({
        shopName: user.shopName,
        gstin: user.gstin,
        address: user.address,
        logoUrl: user.logoUrl,
        upiId: user.upiId
      });

      if (user.gstRates) {
        this.gstRatesArray = user.gstRates.split(',').map(r => parseFloat(r)).sort((a: number, b: number) => a - b);
      }
    }
  }

  addGstRate(value: string) {
    const rate = parseFloat(value);
    if (!isNaN(rate) && !this.gstRatesArray.includes(rate)) {
      this.gstRatesArray.push(rate);
      this.gstRatesArray.sort((a: number, b: number) => a - b);
    }
  }

  removeGstRate(index: number) {
    this.gstRatesArray.splice(index, 1);
  }

  async saveGstRates() {
    this.loading = true;
    const currentUser = this.authService.currentUserValue!;
    const updatedUser: User = {
      ...currentUser,
      gstRates: this.gstRatesArray.join(',')
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: () => {
        this.loading = false;
        this.notificationService.success('GST rates updated successfully!');
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Failed to update GST rates');
      }
    });
  }

  onSave() {
    if (this.profileForm.invalid) return;

    this.loading = true;
    const currentUser = this.authService.currentUserValue!;
    const updatedUser: User = {
      ...currentUser,
      shopName: this.profileForm.get('shopName')?.value!,
      gstin: this.profileForm.get('gstin')?.value!,
      address: this.profileForm.get('address')?.value!,
      logoUrl: this.profileForm.get('logoUrl')?.value!,
      upiId: this.profileForm.get('upiId')?.value!
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: () => {
        this.loading = false;
        this.notificationService.success('Profile updated successfully!');
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Failed to update profile');
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.notificationService.success('Password changed successfully!');
          this.passwordForm.reset();
        } else {
          this.notificationService.error(res.message || 'Failed to change password');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error('Error: ' + (err.error?.message || 'Failed to change password'));
      }
    });
  }
}
