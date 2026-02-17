import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../invoice.service';
import { AuthService, User } from '../auth.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    private invoiceService = inject(InvoiceService);
    private authService = inject(AuthService);
    private router = inject(Router);

    stats: any = {
        totalSales: 0,
        totalGST: 0,
        totalInvoices: 0,
        topProducts: [],
        lowStockItems: []
    };
    recentBills: any[] = [];
    currentUser: User | null = null;

    ngOnInit(): void {
        this.currentUser = this.authService.currentUserValue;

        // Fetch fresh profile data to ensure subscription status is up to date (e.g. referral rewards)
        this.authService.refreshProfile().subscribe(user => {
            this.currentUser = user;
        });

        this.invoiceService.getDashboardStats().subscribe(data => {
            this.stats = data;
        });
        this.invoiceService.getBills(1, 5).subscribe(data => {
            this.recentBills = data.items;
        });
    }

    get isPro(): boolean {
        if (!this.currentUser?.subscriptionType) return false;
        if (this.currentUser.subscriptionType !== 'PRO') return false;
        if (!this.currentUser.subscriptionExpiry) return false;
        return new Date(this.currentUser.subscriptionExpiry) > new Date();
    }

    get subscriptionStatus(): string {
        return this.isPro ? 'PRO' : 'FREE';
    }

    get invoiceUsage(): string {
        if (this.isPro) return 'Unlimited';
        const used = this.stats.totalInvoices || 0;
        return `${used}/10`;
    }

    get expiryDate(): string | null {
        if (!this.isPro || !this.currentUser?.subscriptionExpiry) return null;
        return new Date(this.currentUser.subscriptionExpiry).toLocaleDateString('en-IN');
    }

    get isNearLimit(): boolean {
        return !this.isPro && this.stats.totalInvoices >= 8;
    }

    get isAtLimit(): boolean {
        return !this.isPro && this.stats.totalInvoices >= 10;
    }

    navigateToSubscription(): void {
        this.router.navigate(['/subscription']);
    }
}
