import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../customer.service';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';

@Component({
    selector: 'app-customer-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-list.component.html',
    styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
    private customerService = inject(CustomerService);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    customers: Customer[] = [];
    searchTerm: string = '';
    isModalOpen: boolean = false;
    isSaving: boolean = false;
    editingCustomer: Customer | null = null;

    // Pagination State
    currentPage: number = 1;
    pageSize: number = 10;
    totalCount: number = 0;
    totalPages: number = 0;

    newCustomer: Customer = {
        name: '',
        mobile: '',
        address: '',
        shopOwnerId: 0
    };

    ngOnInit(): void {
        this.loadCustomers();
    }

    loadCustomers(): void {
        this.customerService.getCustomers(this.currentPage, this.pageSize).subscribe(data => {
            this.customers = data.items;
            this.totalCount = data.totalCount;
            this.totalPages = data.totalPages;
        });
    }

    get filteredCustomers(): Customer[] {
        return this.customers.filter(c =>
            c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.mobile.includes(this.searchTerm)
        );
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadCustomers();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadCustomers();
        }
    }

    openAddModal(): void {
        this.editingCustomer = null;
        this.newCustomer = {
            name: '',
            mobile: '',
            address: '',
            shopOwnerId: 0
        };
        this.isModalOpen = true;
    }

    openEditModal(customer: Customer): void {
        this.editingCustomer = { ...customer };
        this.newCustomer = { ...customer };
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
    }

    saveCustomer(): void {
        this.isSaving = true;
        this.customerService.createOrUpdateCustomer(this.newCustomer).subscribe({
            next: () => {
                this.isSaving = false;
                this.loadCustomers();
                this.closeModal();
            },
            error: (err) => {
                this.isSaving = false;
                console.error('Error saving customer', err);
                this.notificationService.error('Failed to save customer');
            }
        });
    }
}
