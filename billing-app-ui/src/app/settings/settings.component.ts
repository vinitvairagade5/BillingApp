import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="settings-page animation-fade-in">
      <header class="page-header">
        <div>
          <h1>Settings</h1>
          <p class="subtitle">Manage your shop profile and tax preferences</p>
        </div>
      </header>

      <div class="settings-grid">
        <div class="settings-main">
          <!-- Profile Section -->
          <section class="section glass card mb-4">
            <div class="section-header">
              <span class="step-num">🏠</span>
              <h3>Shop Profile</h3>
            </div>

            <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="profile-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Business / Shop Name</label>
                  <input type="text" formControlName="shopName" class="premium-input">
                </div>
                <div class="form-group">
                  <label>GSTIN (Optional)</label>
                  <input type="text" formControlName="gstin" class="premium-input" placeholder="e.g. 07AAAAA0000A1Z5">
                </div>
              </div>

              <div class="form-group">
                <label>Business Address</label>
                <textarea formControlName="address" class="premium-input" rows="3"></textarea>
              </div>

              <div class="form-group">
                <label>Logo URL</label>
                <input type="text" formControlName="logoUrl" class="premium-input" placeholder="https://example.com/logo.png">
                <p class="helper-text">Enter a direct link to your shop logo (PNG/JPG recommended).</p>
              </div>

              <div class="profile-footer">
                <button type="submit" class="btn btn-primary" [disabled]="profileForm.invalid || loading">
                  <span *ngIf="!loading">Save Changes</span>
                  <span *ngIf="loading">Saving...</span>
                </button>
              </div>
            </form>
          </section>

          <!-- GST Rates Section -->
          <section class="section glass card">
            <div class="section-header">
              <span class="step-num">🧾</span>
              <h3>GST Rate Configuration</h3>
            </div>
            
            <p class="section-desc">Add or remove the GST rate percentages available during invoice creation.</p>
            
            <div class="gst-manager">
                <div class="gst-tags">
                    <div *ngFor="let rate of gstRatesArray; let i = index" class="gst-tag">
                        {{ rate }}%
                        <button class="remove-rate" (click)="removeGstRate(i)">×</button>
                    </div>
                </div>
                
                <div class="add-rate-box">
                    <input type="number" #newRateInput placeholder="New Rate (e.g. 15)" class="premium-input sm">
                    <button class="btn btn-secondary sm" (click)="addGstRate(newRateInput.value); newRateInput.value=''">Add Rate</button>
                </div>
            </div>
            
            <div class="profile-footer border-t mt-4 pt-4">
                <button class="btn btn-primary" (click)="saveGstRates()" [disabled]="loading">
                    Save GST Rates
                </button>
            </div>
          </section>
        </div>

        <aside class="settings-sidebar">
          <div class="card glass preview-card">
            <h3>Logo Preview</h3>
            <div class="logo-preview">
              <img [src]="profileForm.get('logoUrl')?.value || 'https://via.placeholder.com/150?text=No+Logo'" alt="Logo Preview">
            </div>
            <p>This logo will appear in the top right of your generated PDF invoices.</p>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { padding-bottom: 40px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { margin: 0; font-size: 32px; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }

    .settings-grid { display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: start; }
    
    .section { padding: 32px; }
    .mb-4 { margin-bottom: 24px; }
    .section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .step-num { font-size: 24px; }
    .section-desc { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    
    .profile-form { display: flex; flex-direction: column; gap: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    
    .premium-input { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 15px; transition: var(--transition); }
    .premium-input.sm { padding: 8px 12px; font-size: 14px; width: 140px; }
    .premium-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px var(--primary-glow); outline: none; }
    
    textarea.premium-input { resize: none; }
    .helper-text { font-size: 12px; color: #94a3b8; margin-top: 4px; }

    .profile-footer { margin-top: 16px; display: flex; justify-content: flex-end; }
    .border-t { border-top: 1px solid #e2e8f0; }
    .mt-4 { margin-top: 24px; }
    .pt-4 { padding-top: 24px; }
    
    .gst-tags { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .gst-tag { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .remove-rate { background: none; border: none; color: #1e40af; cursor: pointer; font-size: 18px; padding: 0; line-height: 1; }
    .remove-rate:hover { color: #ef4444; }
    
    .add-rate-box { display: flex; gap: 12px; align-items: center; }
    
    .btn.sm { padding: 8px 16px; font-size: 14px; border-radius: 10px; }

    .preview-card { padding: 24px; text-align: center; }
    .logo-preview { width: 150px; height: 150px; margin: 20px auto; border: 1px solid #e2e8f0; border-radius: 16px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: white; }
    .logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .preview-card p { font-size: 13px; color: #64748b; line-height: 1.5; }

    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loading = false;
  gstRatesArray: number[] = [0, 5, 12, 18, 28];

  profileForm = this.fb.group({
    shopName: ['', Validators.required],
    gstin: [''],
    address: [''],
    logoUrl: ['']
  });

  ngOnInit() {
    const user = this.authService.currentUserValue;
    if (user) {
      this.profileForm.patchValue({
        shopName: user.shopName,
        gstin: user.gstin,
        address: user.address,
        logoUrl: user.logoUrl
      });

      if (user.gstRates) {
        this.gstRatesArray = user.gstRates.split(',').map(r => parseFloat(r)).sort((a, b) => a - b);
      }
    }
  }

  addGstRate(value: string) {
    const rate = parseFloat(value);
    if (!isNaN(rate) && !this.gstRatesArray.includes(rate)) {
      this.gstRatesArray.push(rate);
      this.gstRatesArray.sort((a, b) => a - b);
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
        alert('GST rates updated successfully!');
      },
      error: () => {
        this.loading = false;
        alert('Failed to update GST rates');
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
      logoUrl: this.profileForm.get('logoUrl')?.value!
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: () => {
        this.loading = false;
        alert('Profile updated successfully!');
      },
      error: () => {
        this.loading = false;
        alert('Failed to update profile');
      }
    });
  }
}
