import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService, Supplier } from '../supplier.service';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';

@Component({
    selector: 'app-supplier-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './supplier-list.component.html',
    styleUrls: ['./supplier-list.component.css']
})
export class SupplierListComponent implements OnInit {
    private supplierService = inject(SupplierService);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    suppliers: Supplier[] = [];
    searchTerm: string = '';
    isModalOpen: boolean = false;
    isSaving: boolean = false;
    editingSupplier: Supplier | null = null;

    // Pagination State
    currentPage: number = 1;
    pageSize: number = 10;
    totalCount: number = 0;
    totalPages: number = 0;

    newSupplier: Supplier = {
        name: '',
        mobile: '',
        address: '',
        gstin: '',
        shopOwnerId: 0
    };

    ngOnInit(): void {
        this.loadSuppliers();
    }

    loadSuppliers(): void {
        this.supplierService.getSuppliers(this.currentPage, this.pageSize).subscribe(data => {
            this.suppliers = data.items;
            this.totalCount = data.totalCount;
            this.totalPages = data.totalPages;
        });
    }

    get filteredSuppliers(): Supplier[] {
        return this.suppliers.filter(c =>
            c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            c.mobile.includes(this.searchTerm)
        );
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadSuppliers();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadSuppliers();
        }
    }

    openAddModal(): void {
        this.editingSupplier = null;
        this.newSupplier = {
            name: '',
            mobile: '',
            address: '',
            gstin: '',
            shopOwnerId: 0
        };
        this.isModalOpen = true;
    }

    openEditModal(supplier: Supplier): void {
        this.editingSupplier = { ...supplier };
        this.newSupplier = { ...supplier };
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
    }

    saveSupplier(): void {
        this.isSaving = true;
        this.supplierService.createOrUpdateSupplier(this.newSupplier).subscribe({
            next: () => {
                this.isSaving = false;
                this.loadSuppliers();
                this.closeModal();
            },
            error: (err) => {
                this.isSaving = false;
                console.error('Error saving supplier', err);
                this.notificationService.error('Failed to save supplier');
            }
        });
    }
}
