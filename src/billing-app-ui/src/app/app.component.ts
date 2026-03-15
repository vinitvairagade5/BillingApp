import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  template: `
    <div class="app-wrapper" [class.no-auth]="!user">
      <!-- Navbar -->
      <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top shadow-sm px-3 d-print-none" *ngIf="user">
        <div class="container-fluid">
          <button class="btn btn-outline-secondary d-lg-none me-2" type="button" (click)="toggleMobileSidebar()">
            <span class="navbar-toggler-icon"></span>
          </button>
          
          <a class="navbar-brand d-flex align-items-center" routerLink="/">
            <div class="logo-icon bg-primary text-white rounded me-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px; font-weight: 800;">B</div>
            <span class="fw-bold">Bill<span class="text-primary">Pro</span></span>
          </a>

          <div class="ms-auto d-flex align-items-center">
            <div class="input-group d-none d-md-flex me-3" style="width: 250px;">
              <span class="input-group-text bg-light border-end-0"><span class="icon">🔍</span></span>
              <input type="text" class="form-control bg-light border-start-0" placeholder="Search invoices...">
            </div>
            
            <button class="btn btn-link text-dark position-relative p-2">
              <span class="icon">🔔</span>
              <span class="position-absolute top-10 start-90 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
            </button>
            
            <div class="dropdown ms-2">
              <button class="btn btn-link text-dark dropdown-toggle d-flex align-items-center p-0 text-decoration-none" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                <div class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px; font-size: 0.8rem;">
                  {{ user.shopName.charAt(0) }}
                </div>
                <span class="d-none d-sm-inline">{{ user.shopName }}</span>
                <span class="badge bg-warning text-dark ms-2 small" *ngIf="user.parentShopId">Staff</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userMenu">
                <li><a class="dropdown-item" routerLink="/settings">Settings</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item text-danger" (click)="logout()">Sign Out</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      <div class="d-flex">
        <!-- Sidebar Navigation (Desktop) -->
        <aside class="sidebar bg-white border-end d-none d-lg-flex flex-column p-3 position-sticky d-print-none" style="top: 72px; height: calc(100vh - 72px); width: 260px; z-index: 1000;" *ngIf="user">
          <ul class="nav nav-pills flex-column mb-auto">
            <li class="nav-item mb-1" *ngIf="hasAccess('dashboard')">
              <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">📊</span> Dashboard
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('bills')">
              <a routerLink="/bills" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">📜</span> Bills
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('products')">
              <a routerLink="/products" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">📦</span> Products
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('customers')">
              <a routerLink="/customers" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">👥</span> Customers
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('suppliers')">
              <a routerLink="/suppliers" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">🏢</span> Suppliers
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('purchases')">
              <a routerLink="/purchases" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">📦</span> Purchases
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('expenses')">
              <a routerLink="/expenses" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">💸</span> Expenses
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('subscription')">
              <a routerLink="/subscription" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">💎</span> Subscription
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('udhaar')">
              <a routerLink="/udhaar" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">📝</span> Udhaar
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('reports')">
              <a routerLink="/reports" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">📊</span> Reports
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="!user?.parentShopId">
              <a routerLink="/staff" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">👨‍💼</span> Staff Access
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="user?.isAdmin">
              <a routerLink="/admin" routerLinkActive="active" class="nav-link d-flex align-items-center text-dark">
                <span class="me-3 fs-5">🛠️</span> Admin
              </a>
            </li>
          </ul>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow-1 p-3 p-md-4 bg-light overflow-x-hidden" style="min-height: 100vh; min-width: 0;">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Offcanvas Sidebar (Mobile) -->
      <div class="offcanvas offcanvas-start" tabindex="-1" id="mobileSidebar" [class.show]="isMobileSidebarOpen" aria-labelledby="mobileSidebarLabel">
        <div class="offcanvas-header border-bottom">
          <h5 class="offcanvas-title fw-bold" id="mobileSidebarLabel">
            Bill<span class="text-primary">Pro</span>
          </h5>
          <button type="button" class="btn-close" (click)="closeMobileSidebar()" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body p-0">
          <ul class="nav nav-pills flex-column p-3">
            <li class="nav-item mb-1" *ngIf="hasAccess('dashboard')">
              <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">📊</span> Dashboard
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('bills')">
              <a routerLink="/bills" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">📜</span> Bills
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('products')">
              <a routerLink="/products" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">📦</span> Products
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('customers')">
              <a routerLink="/customers" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">👥</span> Customers
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('suppliers')">
              <a routerLink="/suppliers" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">🏢</span> Suppliers
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('purchases')">
              <a routerLink="/purchases" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">📦</span> Purchases
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('expenses')">
              <a routerLink="/expenses" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">💸</span> Expenses
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('subscription')">
              <a routerLink="/subscription" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">💎</span> Subscription
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('udhaar')">
              <a routerLink="/udhaar" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">📝</span> Udhaar
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="hasAccess('reports')">
              <a routerLink="/reports" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">📊</span> Reports
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="!user?.parentShopId">
              <a routerLink="/staff" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">👨‍💼</span> Staff Access
              </a>
            </li>
            <li class="nav-item mb-1" *ngIf="user?.isAdmin">
              <a routerLink="/admin" routerLinkActive="active" class="nav-link text-dark" (click)="closeMobileSidebar()">
                <span class="me-3">🛠️</span> Admin
              </a>
            </li>
          </ul>
        </div>
        <div class="offcanvas-footer p-3 border-top mt-auto">
          <button class="btn btn-outline-danger w-100" (click)="logout()">Sign Out</button>
        </div>
      </div>
      <div class="offcanvas-backdrop fade show" *ngIf="isMobileSidebarOpen" (click)="closeMobileSidebar()"></div>
    </div>
  `,
  styles: [`
    .nav-link {
      transition: all 0.2s ease;
      border-radius: 8px;
    }
    .nav-link:hover {
      background-color: rgba(0, 123, 255, 0.05);
      color: var(--bs-primary) !important;
    }
    .nav-link.active {
      background-color: var(--bs-primary) !important;
      color: white !important;
      box-shadow: 0 4px 12px rgba(0, 123, 255, 0.2);
    }
    .no-auth .main-container {
      padding: 0;
    }
    .sidebar {
      transition: width 0.3s ease;
    }
    @media (max-width: 991.98px) {
      .navbar {
        padding: 0.75rem 1rem !important;
      }
      .navbar-brand {
        margin-left: 0 !important;
        font-size: 1.1rem;
      }
      .logo-icon {
        width: 28px !important;
        height: 28px !important;
        font-size: 0.9rem;
      }
    }
    .offcanvas {
      border-radius: 0 1.5rem 1.5rem 0;
      box-shadow: 0 0 2rem rgba(0,0,0,0.1);
    }
    .offcanvas-backdrop.show {
      opacity: 0.3;
      backdrop-filter: blur(2px);
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
    if (this.authService.currentUserValue) {
      this.authService.refreshProfile().subscribe({
        error: () => this.logout() // If token invalid/expired during refresh
      });
    }
  }

  hasAccess(menu: string): boolean {
    if (!this.user) return false;
    const menuSlug = menu.toLowerCase();
    if (menuSlug === 'dashboard') return true; 
    if (this.user.isAdmin) return true;
    if (!this.user.parentShopId) return true; 
    
    if (!this.user.accessibleMenus) return false;
    try {
      const menus: string[] = JSON.parse(this.user.accessibleMenus).map((m: string) => m.toLowerCase());
      return menus.includes(menuSlug);
    } catch {
      return false;
    }
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
