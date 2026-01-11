import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  template: `
    <div class="app-layout" [class.no-sidebar]="!user">
      <!-- Sidebar -->
      <aside class="sidebar glass" *ngIf="user">
        <div class="logo-area">
          <div class="logo-icon">B</div>
          <span class="logo-text">Bill<span>Pro</span></span>
        </div>
        
        <nav class="nav-menu">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            <span class="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/bills" routerLinkActive="active" class="nav-link">
            <span class="icon">📜</span>
            <span>Bills</span>
          </a>
          <a routerLink="/products" routerLinkActive="active" class="nav-link">
            <span class="icon">📦</span>
            <span>Products</span>
          </a>
          <a routerLink="/customers" routerLinkActive="active" class="nav-link">
            <span class="icon">👥</span>
            <span>Customers</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link">
             <span class="icon">⚙️</span>
             <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="avatar">{{ user.shopName.charAt(0) }}</div>
            <div class="user-info">
              <div class="user-name">{{ user.shopName }}</div>
              <div class="user-action" (click)="logout()">Sign Out</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-container">
        <header class="top-bar glass" *ngIf="user">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search invoices...">
          </div>
          <div class="header-actions">
            <button class="icon-btn" title="Notifications">🔔</button>
            <button class="icon-btn" title="Settings">⚙️</button>
          </div>
        </header>

        <div class="content-wrapper" [class.full-width]="!user">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .app-layout.no-sidebar { background: #f8fafc; }

    /* Sidebar */
    .sidebar {
      width: 280px;
      height: 100vh;
      position: sticky;
      top: 0;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-color);
      z-index: 100;
    }

    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 48px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--primary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 20px;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .logo-text {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .logo-text span {
      color: var(--primary);
    }

    .nav-menu {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      transition: var(--transition);
    }

    .nav-link .icon {
      font-size: 18px;
    }

    .nav-link:hover:not(.disabled) {
      background: rgba(59, 130, 246, 0.05);
      color: var(--primary);
    }

    .nav-link.active {
      background: var(--primary);
      color: white;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .nav-link.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .user-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .user-action {
      font-size: 12px;
      color: var(--danger);
      cursor: pointer;
      font-weight: 500;
    }

    /* Main Container */
    .main-container {
      flex: 1;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .top-bar {
      height: 72px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border: 1px solid var(--border-color);
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #f1f5f9;
      padding: 8px 16px;
      border-radius: 10px;
      width: 320px;
    }

    .search-bar input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      width: 100%;
      color: #1e293b;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: var(--transition);
    }

    .icon-btn:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .content-wrapper {
      flex: 1;
    }
    .content-wrapper.full-width { padding: 0; }
  `]
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: any = null;

  constructor() {
    this.authService.currentUser$.subscribe(u => this.user = u);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
