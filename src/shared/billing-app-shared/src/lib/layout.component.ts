import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface MenuItem {
    label: string;
    icon: string;
    route: string;
    badge?: string | number;
}

@Component({
    selector: 'lib-layout',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="app-shell" [class.sidebar-open]="isSidebarOpen">
      <!-- Sidebar -->
      <aside class="sidebar glass shadow-lg">
        <div class="sidebar-header">
          <div class="logo-box">
            <span class="logo-icon">🚀</span>
            <h2 class="app-title">{{ appTitle }}</h2>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <a *ngFor="let item of menuItems" 
             [routerLink]="item.route" 
             routerLinkActive="active" 
             class="nav-item">
            <span class="icon">{{ item.icon }}</span>
            <span class="label">{{ item.label }}</span>
            <span class="badge" *ngIf="item.badge">{{ item.badge }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button (click)="onLogout.emit()" class="btn-logout">
            <span class="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="main-container">
        <!-- Top Bar -->
        <header class="topbar glass">
          <div class="topbar-left">
            <button class="btn-menu-toggle" (click)="toggleSidebar()">☰</button>
            <h2 class="page-title">{{ currentRouteTitle }}</h2>
          </div>
          <div class="topbar-right">
             <div class="user-profile">
               <div class="user-avatar">{{ userName?.charAt(0) }}</div>
               <span class="user-name">{{ userName }}</span>
             </div>
          </div>
        </header>

        <!-- Content -->
        <section class="content-viewport">
          <ng-content></ng-content>
        </section>

        <!-- Bottom Tab Bar (Mobile) -->
        <nav class="mobile-tabs glass">
          <a *ngFor="let item of menuItems.slice(0, 5)" 
             [routerLink]="item.route" 
             routerLinkActive="active" 
             class="tab-item">
            <span class="icon">{{ item.icon }}</span>
            <span class="label">{{ item.label }}</span>
          </a>
        </nav>
      </main>
    </div>
  `,
    styles: [`
    .app-shell { display: flex; height: 100vh; background: #f1f5f9; overflow: hidden; }
    
    .sidebar { width: 280px; height: 100%; display: flex; flex-direction: column; background: white; z-index: 100; transition: transform 0.3s ease; }
    .sidebar-header { padding: 32px; border-bottom: 1px solid #f1f5f9; }
    .logo-box { display: flex; align-items: center; gap: 12px; }
    .logo-icon { font-size: 28px; }
    .app-title { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em; }

    .sidebar-nav { flex: 1; padding: 20px 16px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; text-decoration: none; color: #64748b; font-weight: 600; transition: 0.2s; }
    .nav-item:hover { background: #f8fafc; color: var(--primary); }
    .nav-item.active { background: #eff6ff; color: var(--primary); }
    .nav-item .icon { font-size: 20px; }
    .nav-item .badge { margin-left: auto; background: var(--danger); color: white; font-size: 11px; padding: 2px 8px; border-radius: 100px; }

    .sidebar-footer { padding: 20px 16px; border-top: 1px solid #f1f5f9; }
    .btn-logout { width: 100%; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: none; background: #fff5f5; border-radius: 12px; color: #c53030; font-weight: 700; cursor: pointer; }

    .main-container { flex: 1; display: flex; flex-direction: column; position: relative; width: 100%; overflow: hidden; }
    
    .topbar { height: 80px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; z-index: 90; }
    .topbar-left { display: flex; align-items: center; gap: 20px; }
    .btn-menu-toggle { display: none; font-size: 24px; background: none; border: none; cursor: pointer; }
    .page-title { margin: 0; font-size: 22px; font-weight: 700; color: #1e293b; }

    .user-profile { display: flex; align-items: center; gap: 12px; padding: 6px 12px; border-radius: 100px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }
    .user-name { font-weight: 600; color: #64748b; font-size: 14px; }

    .content-viewport { flex: 1; padding: 32px; overflow-y: auto; overflow-x: hidden; }

    .mobile-tabs { display: none; }

    @media (max-width: 1024px) {
      .sidebar { position: fixed; left: -280px; }
      .sidebar-open .sidebar { transform: translateX(280px); }
      .btn-menu-toggle { display: block; }
      .mobile-tabs { display: flex; position: absolute; bottom: 0; left: 0; right: 0; height: 72px; background: white; border-top: 1px solid #e2e8f0; justify-content: space-around; align-items: center; padding: 0 10px; }
      .tab-item { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #94a3b8; font-size: 10px; font-weight: 700; gap: 4px; }
      .tab-item.active { color: var(--primary); }
      .tab-item .icon { font-size: 20px; }
      .content-viewport { padding-bottom: 100px; }
    }
  `]
})
export class LayoutComponent {
    @Input() appTitle: string = 'App Pro';
    @Input() currentRouteTitle: string = 'Overview';
    @Input() userName: string | null = 'User';
    @Input() menuItems: MenuItem[] = [];

    @Output() onLogout = new EventEmitter<void>();

    isSidebarOpen = false;

    toggleSidebar() {
        this.isSidebarOpen = !this.isSidebarOpen;
    }
}
