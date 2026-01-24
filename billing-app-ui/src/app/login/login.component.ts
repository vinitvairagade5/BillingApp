import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-page">
      <div class="login-card glass">
        <div class="login-header">
          <div class="logo-icon">B</div>
          <h1>Bill<span>Pro</span></h1>
          <p>{{ isRegister ? 'Join thousands of smart shop owners' : 'Welcome back, partner!' }}</p>
        </div>

        <form [formGroup]="authForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group" *ngIf="isRegister">
            <label>Shop Name</label>
            <input type="text" formControlName="shopName" class="premium-input" placeholder="e.g. Electra Electronics">
            <div class="error" *ngIf="showError('shopName')">Shop name is required</div>
          </div>

          <div class="form-group">
            <label>Username</label>
            <input type="text" formControlName="username" class="premium-input" placeholder="Your unique username">
            <div class="error" *ngIf="showError('username')">Username is required</div>
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" formControlName="password" class="premium-input" placeholder="••••••••">
            <div class="error" *ngIf="showError('password')">Password is required (min 6 chars)</div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="authForm.invalid || loading">
            <span *ngIf="!loading">{{ isRegister ? 'Create My Account' : 'Sign In to Dashboard' }}</span>
            <span *ngIf="loading" class="spinner"></span>
          </button>
        </form>

        <div class="auth-footer">
          <p>{{ isRegister ? 'Already have an account?' : "Don't have an account yet?" }}</p>
          <button class="btn-text" (click)="toggleMode()">
            {{ isRegister ? 'Sign In Instead' : 'Create Free Account' }}
          </button>
        </div>
      </div>

      <!-- Decorative Background Elements -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      overflow: hidden;
      position: relative;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 48px;
      border-radius: 32px;
      z-index: 10;
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      background: rgba(255, 255, 255, 0.8); /* Fallback/Base */
    }

    @media (max-width: 480px) {
      .login-page {
        align-items: flex-start;
        padding-top: 40px;
        background: white; /* Simplify background on mobile */
      }
      
      .login-card {
        padding: 32px 24px;
        border-radius: 0;
        box-shadow: none;
        border: none;
        background: transparent;
      }

      .blob { display: none; } /* Hide heavy blobs on mobile */
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-icon {
      width: 64px;
      height: 64px;
      background: var(--primary);
      color: white;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 800;
      margin: 0 auto 24px;
      box-shadow: 0 12px 24px var(--primary-glow);
    }

    .login-header h1 {
      font-size: 32px;
      margin: 0;
      letter-spacing: -0.04em;
    }

    .login-header h1 span { color: var(--primary); }

    .login-header p {
      color: #64748b;
      margin-top: 8px;
      font-size: 15px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      padding-left: 4px;
    }

    .premium-input {
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 18px;
      font-size: 15px;
      transition: var(--transition);
    }

    .premium-input:focus {
      background: white;
      border-color: var(--primary);
      box-shadow: 0 0 0 4px var(--primary-glow);
      outline: none;
    }

    .btn-block {
      width: 100%;
      padding: 16px;
      border-radius: 14px;
      font-size: 16px;
      margin-top: 12px;
    }

    .auth-footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(226, 232, 240, 0.5);
    }

    .auth-footer p {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 700;
      cursor: pointer;
      font-size: 15px;
    }

    .error { color: var(--danger); font-size: 12px; margin-top: 4px; padding-left: 4px; }

    /* Blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: 1;
      opacity: 0.4;
    }

    .blob-1 {
      width: 400px;
      height: 400px;
      background: #3b82f6;
      top: -100px;
      right: -100px;
    }

    .blob-2 {
      width: 500px;
      height: 500px;
      background: #8b5cf6;
      bottom: -150px;
      left: -150px;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isRegister = false;
  loading = false;

  authForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    shopName: ['']
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
    const { username, password, shopName } = this.authForm.value;

    if (this.isRegister) {
      this.authService.register({ username: username!, passwordHash: password!, shopName: shopName! }).subscribe({
        next: () => {
          this.isRegister = false;
          this.loading = false;
          alert('Registration successful! Please login.');
        },
        error: (err) => {
          alert(err.error || 'Registration failed');
          this.loading = false;
        }
      });
    } else {
      this.authService.login(username!, password!).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          alert('Invalid credentials');
          this.loading = false;
        }
      });
    }
  }
}
