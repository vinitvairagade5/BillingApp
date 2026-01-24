import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../customer.service';
import { AuthService } from '../auth.service';

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

    customers: Customer[] = [];
    searchTerm: string = '';
    isModalOpen: boolean = false;
    isSaving: boolean = false;
    editingCustomer: Customer | null = null;

    newCustomer: Customer = {
        name: '',
        mobile: '',
        address: '',
        shopOwnerId: 0
    };

    ngOnInit(): void {
        const user = this.authService.currentUserValue;
        if (user) {
            this.newCustomer.shopOwnerId = user.id;
            this.loadCustomers();
        }
    }

    loadCustomers(): void {
        const user = this.authService.currentUserValue;
        if (user) {
            this.customerService.getCustomers(user.id).subscribe(data => {
                this.customers = data;
            });
        }
    }

    get filteredCustomers(): Customer[] {
        return this.customers.filter(c =>
            c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.mobile.includes(this.searchTerm)
        );
    }

    openAddModal(): void {
        this.editingCustomer = null;
        const user = this.authService.currentUserValue;
        this.newCustomer = {
            name: '',
            mobile: '',
            address: '',
            shopOwnerId: user?.id || 0
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
                alert('Failed to save customer');
            }
        });
    }
}
