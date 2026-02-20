import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-page overflow-hidden">
      <div class="container d-flex align-items-center justify-content-center min-vh-100 position-relative z-3">
        <div class="card border-0 shadow-lg rounded-5 overflow-hidden auth-card animate-slide-up">
          <div class="row g-0">
            <div class="col-12 p-4 p-md-5">
              <div class="text-center mb-5">
                <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-4 shadow-sm mb-3" style="width: 64px; height: 64px; font-size: 2rem; font-weight: 800;">
                  B
                </div>
                <h1 class="h2 fw-bold mb-1">Bill<span class="text-primary">Pro</span></h1>
                <p class="text-muted small">{{ isRegister ? 'Join thousands of smart shop owners' : 'Welcome back, partner!' }}</p>
              </div>

              <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="needs-validation">
                <div class="mb-3" *ngIf="isRegister">
                  <label class="form-label small fw-bold text-secondary">Shop Name</label>
                  <input type="text" formControlName="shopName" class="form-control form-control-lg rounded-3 fs-6 p-3" 
                         [class.is-invalid]="showError('shopName')" placeholder="e.g. My Awesome Shop">
                  <div class="invalid-feedback" *ngIf="showError('shopName')">Shop name is required</div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold text-secondary">Username</label>
                  <input type="text" formControlName="username" class="form-control form-control-lg rounded-3 fs-6 p-3" 
                         [class.is-invalid]="showError('username')" placeholder="Your unique username">
                  <div class="invalid-feedback" *ngIf="showError('username')">Username is required</div>
                </div>

                <div class="mb-4">
                  <label class="form-label small fw-bold text-secondary">Password</label>
                  <input type="password" formControlName="password" class="form-control form-control-lg rounded-3 fs-6 p-3" 
                         [class.is-invalid]="showError('password')" placeholder="••••••••">
                  <div class="invalid-feedback" *ngIf="showError('password')">Password is required (min 6 chars)</div>
                </div>

                <div class="mb-4" *ngIf="isRegister">
                  <label class="form-label small fw-bold text-secondary">Referral Code (Optional)</label>
                  <input type="text" formControlName="referralCode" class="form-control form-control-lg rounded-3 fs-6 p-3 text-uppercase" placeholder="E.G. ABCD1234">
                </div>

                <button type="submit" class="btn btn-primary btn-lg w-100 rounded-3 py-3 fw-bold shadow-sm mb-4" [disabled]="authForm.invalid || loading">
                  <span *ngIf="!loading">{{ isRegister ? 'Create My Account' : 'Sign In to Dashboard' }}</span>
                  <div *ngIf="loading" class="spinner-border spinner-border-sm" role="status"></div>
                </button>
              </form>

              <div class="text-center pt-3 border-top mt-2">
                <p class="text-muted small mb-2">{{ isRegister ? 'Already have an account?' : "Don't have an account yet?" }}</p>
                <button type="button" class="btn btn-link text-decoration-none fw-bold p-0" (click)="toggleMode()">
                  {{ isRegister ? 'Sign In Instead' : 'Create Free Account' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Decorative Background Elements -->
      <div class="blob blob-1 position-absolute"></div>
      <div class="blob blob-2 position-absolute"></div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background-color: #f8fafc;
      position: relative;
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
    }

    .animate-slide-up {
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .blob {
      border-radius: 50%;
      filter: blur(100px);
      z-index: 1;
      opacity: 0.15;
    }

    .blob-1 {
      width: 500px;
      height: 500px;
      background-color: #0d6efd;
      top: -150px;
      right: -150px;
      animation: float 20s infinite alternate;
    }

    .blob-2 {
      width: 600px;
      height: 600px;
      background-color: #6f42c1;
      bottom: -200px;
      left: -200px;
      animation: float 25s infinite alternate-reverse;
    }

    @keyframes float {
      from { transform: translate(0, 0); }
      to { transform: translate(50px, 50px); }
    }

    .form-control:focus {
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
      border-color: #0d6efd;
    }

    @media (max-width: 576px) {
      .auth-card {
        border-radius: 0 !important;
        box-shadow: none !important;
        background: transparent;
      }
      .login-page {
        background: white;
      }
      .blob {
        display: none;
      }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isRegister = false;
  loading = false;

  authForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    shopName: [''],
    referralCode: ['']
  });

  toggleMode() {
    this.isRegister = !this.isRegister;
    if (this.isRegister) {
      this.authForm.get('shopName')?.setValidators([Validators.required]);
    } else {
      this.authForm.get('shopName')?.clearValidators();
    }
    this.authForm.get('shopName')?.updateValueAndValidity();
  }

  showError(control: string) {
    const c = this.authForm.get(control);
    return c?.touched && c?.invalid;
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    this.loading = true;
    const { username, password, shopName, referralCode } = this.authForm.value;

    if (this.isRegister) {
      this.authService.register({
        username: username!,
        passwordHash: password!,
        shopName: shopName!,
        referralCode: referralCode || undefined
      }).subscribe({
        next: () => {
          this.isRegister = false;
          this.loading = false;
          this.notificationService.success('Registration successful! Please login.');
        },
        error: (err) => {
          this.notificationService.error(err.error || 'Registration failed');
          this.loading = false;
        }
      });
    } else {
      this.authService.login(username!, password!).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.notificationService.error('Invalid credentials');
          this.loading = false;
        }
      });
    }
  }
}
