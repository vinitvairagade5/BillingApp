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
      <!-- Mobile Overlay -->
      <div class="mobile-overlay" *ngIf="isMobileSidebarOpen" (click)="toggleMobileSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar glass" *ngIf="user" [class.collapsed]="isSidebarCollapsed" [class.mobile-open]="isMobileSidebarOpen">
        <div class="logo-area" (click)="toggleSidebar()" title="Toggle Sidebar">
          <div class="logo-icon">B</div>
          <span class="logo-text">Bill<span>Pro</span></span>
        </div>
        
        <nav class="nav-menu">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileSidebar()">
            <span class="icon">📊</span>
            <span class="link-text">Dashboard</span>
          </a>
          <a routerLink="/bills" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
            <span class="icon">📜</span>
            <span class="link-text">Bills</span>
          </a>
          <a routerLink="/products" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
            <span class="icon">📦</span>
            <span class="link-text">Products</span>
          </a>
          <a routerLink="/customers" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
            <span class="icon">👥</span>
            <span class="link-text">Customers</span>
          </a>
          <a routerLink="/subscription" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
            <span class="icon">💎</span>
            <span class="link-text">Subscription</span>
          </a>
          <a routerLink="/settings" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
             <span class="icon">⚙️</span>
             <span class="link-text">Settings</span>
          </a>
          <a routerLink="/udhaar" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
             <span class="icon">📝</span>
             <span class="link-text">Udhaar</span>
          </a>
          <a routerLink="/reports" routerLinkActive="active" class="nav-link" (click)="closeMobileSidebar()">
             <span class="icon">📊</span>
             <span class="link-text">Reports</span>
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-link" *ngIf="user?.isAdmin" (click)="closeMobileSidebar()">
             <span class="icon">🛠️</span>
             <span class="link-text">Admin</span>
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
          <div class="mobile-toggle visible-mobile">
            <button class="icon-btn" (click)="toggleMobileSidebar()">☰</button>
          </div>

          <div class="search-bar hidden-mobile">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search invoices...">
          </div>
          <div class="header-actions">
            <!-- Mobile Search Toggle (Optional) -->
            <button class="icon-btn visible-mobile">🔍</button> 
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
    /* Layout */
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-main);
      position: relative;
    }
    .app-layout.no-sidebar { background: #f8fafc; }

    /* Sidebar */
    .sidebar {
      width: 280px;
      height: 100vh;
      position: sticky;
      top: 0;
      padding: var(--space-xl) var(--space-lg);
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-color);
      z-index: 50;
      transition: var(--transition-normal);
      overflow-x: hidden;
      white-space: nowrap;
      background: var(--bg-sidebar);
    }

    .sidebar.collapsed {
      width: 88px;
      padding: var(--space-xl) var(--space-md);
    }
    
    .logo-area {
      display: flex;
      align-items: center;
      margin-bottom: var(--space-2xl);
      cursor: pointer;
      min-height: 48px;
      padding-left: var(--space-xs);
    }
    .sidebar.collapsed .logo-area {
      justify-content: center;
      padding-left: 0;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: var(--primary);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 20px;
      box-shadow: 0 4px 12px var(--primary-glow);
      flex-shrink: 0;
      transition: var(--transition-normal);
      margin-right: var(--space-sm);
    }
    
    .sidebar.collapsed .logo-icon {
      transform: scale(1.1);
      margin-right: 0;
    }

    /* Text Elements */
    .logo-text, .link-text, .user-info {
      opacity: 1;
      visibility: visible;
      max-width: 180px;
      transform: translateX(0);
      transition: var(--transition-normal);
    }

    .sidebar.collapsed .logo-text,
    .sidebar.collapsed .link-text,
    .sidebar.collapsed .user-info {
      opacity: 0;
      visibility: hidden;
      max-width: 0;
      margin: 0;
      pointer-events: none;
      transform: translateX(-10px);
    }

    .logo-text {
      font-size: 1.35rem;
      font-family: var(--font-heading);
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
      gap: var(--space-xs);
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      text-decoration: none;
      color: var(--secondary);
      font-weight: 500;
      transition: var(--transition-normal);
      white-space: nowrap;
      height: 48px; 
    }
    .sidebar.collapsed .nav-link {
      justify-content: center;
      padding: var(--space-sm) 0;
    }

    .nav-link .icon {
      font-size: 1.15rem;
      flex-shrink: 0;
      transition: var(--transition-normal);
      margin-right: var(--space-md);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
    }
    .sidebar.collapsed .nav-link .icon {
      font-size: 1.35rem;
      margin-right: 0;
    }

    .nav-link:hover:not(.disabled) {
      background: rgba(59, 130, 246, 0.05); /* keep subtle blue tint */
      color: var(--primary);
    }

    .nav-link.active {
      background: var(--primary);
      color: white;
      box-shadow: 0 4px 12px var(--primary-glow);
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: var(--space-lg);
      border-top: 1px solid var(--border-color);
      transition: opacity 0.3s;
    }

    .user-profile {
      display: flex;
      align-items: center;
      min-height: 40px;
    }
    .sidebar.collapsed .user-profile {
      justify-content: center;
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
      flex-shrink: 0;
      margin-right: var(--space-sm);
    }
    .sidebar.collapsed .avatar {
      margin-right: 0;
    }

    .user-info {
        display: flex;
        flex-direction: column;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .user-action {
      font-size: 0.8rem;
      color: var(--danger);
      cursor: pointer;
      font-weight: 500;
    }

    /* Main Container */
    .main-container {
      flex: 1;
      padding: var(--space-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
      min-width: 0; /* Prevention for grid blowout */
      transition: padding 0.3s;
    }

    .top-bar {
      height: 72px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-lg);
      background: white; /* fallback */
      border: 1px solid var(--border-color);
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      background: var(--bg-input);
      padding: var(--space-xs) var(--space-md);
      border-radius: var(--radius-md);
      width: 320px;
      transition: var(--transition-fast);
    }
    .search-bar:focus-within {
        background: white;
        box-shadow: 0 0 0 2px var(--primary-glow);
        border: 1px solid var(--primary);
    }

    .search-bar input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.9rem;
      width: 100%;
      color: #1e293b;
      padding: 0; /* specific override */
    }
    .search-bar input:focus {
        box-shadow: none;
        border: none;
    }

    .header-actions {
      display: flex;
      gap: var(--space-sm);
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      transition: var(--transition-normal);
    }

    .icon-btn:hover {
      background: var(--bg-main);
      border-color: var(--secondary-light);
      color: var(--primary);
    }

    .content-wrapper {
      flex: 1;
      width: 100%; 
      overflow-x: hidden;
    }
    .content-wrapper.full-width { padding: 0; }

    @media (max-width: 768px) {
      .app-layout {
        flex-direction: column;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        width: 80% !important; /* Not full width, but enough */
        max-width: 300px;
        box-shadow: var(--shadow-premium);
        background: var(--bg-sidebar);
        padding: var(--space-lg);
        height: 100%; /* For Safari fix */
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .sidebar.collapsed {
        width: 80% !important; 
        max-width: 300px;
      }

      .mobile-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        z-index: 40; /* Below sidebar (50) */
        animation: fadeIn 0.2s ease-out;
      }
      
      .top-bar {
        height: 60px; /* Slimmer on mobile */
        padding: 0 var(--space-md);
        border-radius: 0; /* Flat on mobile often looks better or stick to radius if margin exists */
        border: none;
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        z-index: 30;
      }
      
      .main-container {
        padding: 0; /* Remove outer padding on mobile for edge-to-edge feel */
      }
      
      .content-wrapper {
        padding: var(--space-md); /* Add padding inside wrapper instead */
      }
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
  `]
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user: any = null;
  isSidebarCollapsed: boolean = false;
  isMobileSidebarOpen: boolean = false;

  constructor() {
    this.authService.currentUser$.subscribe(u => this.user = u);
  }

  toggleSidebar() {
    // Only verify collapse on desktop
    if (window.innerWidth > 768) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
  }

  collapseSidebar() {
    if (window.innerWidth > 768) {
      this.isSidebarCollapsed = true;
    }
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
