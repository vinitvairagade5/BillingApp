import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../auth.service';

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
        topProducts: []
    };
    recentBills: any[] = [];

    ngOnInit(): void {
        const user = this.authService.currentUserValue;
        if (user) {
            this.invoiceService.getDashboardStats(user.id).subscribe(data => {
                this.stats = data;
            });
            this.invoiceService.getBills(user.id).subscribe(data => {
                this.recentBills = data.slice(0, 5);
            });
        }
    }
}
