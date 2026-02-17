import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Item } from '../product.service';
import { AuthService } from '../auth.service';
import { NotificationService } from '../notification.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-list.component.html',
    styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
    private productService = inject(ProductService);
    private authService = inject(AuthService);
    private notificationService = inject(NotificationService);

    products: Item[] = [];
    searchTerm: string = '';
    isModalOpen: boolean = false;
    isSaving: boolean = false;
    editingProduct: Item | null = null;

    // Pagination State
    currentPage: number = 1;
    pageSize: number = 10;
    totalCount: number = 0;
    totalPages: number = 0;

    newProduct: Item = {
        name: '',
        price: 0,
        category: '',
        hsnCode: '',
        gstRate: 18,
        shopOwnerId: 0,
        stockQuantity: 0,
        lowStockThreshold: 5
    };

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.productService.getProducts(this.currentPage, this.pageSize, this.searchTerm).subscribe(data => {
            this.products = data.items;
            this.totalCount = data.totalCount;
            this.totalPages = data.totalPages;
        });
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadProducts();
    }

    // Removed client-side filtering getter causing index mismatches. Now using server-side search.
    get filteredProducts(): Item[] {
        return this.products;
    }

    nextPage(): void {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadProducts();
        }
    }

    prevPage(): void {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadProducts();
        }
    }

    openAddModal(): void {
        this.editingProduct = null;
        this.newProduct = {
            name: '',
            price: 0,
            category: '',
            hsnCode: '',
            gstRate: 18,
            shopOwnerId: 0,
            stockQuantity: 0,
            lowStockThreshold: 5
        };
        this.isModalOpen = true;
    }

    openEditModal(product: Item): void {
        this.editingProduct = { ...product };
        this.newProduct = { ...product };
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
    }

    saveProduct(): void {
        this.isSaving = true;
        const request = this.editingProduct
            ? this.productService.updateProduct(this.newProduct)
            : this.productService.createProduct(this.newProduct);

        request.subscribe({
            next: () => {
                this.isSaving = false;
                this.loadProducts();
                this.closeModal();
            },
            error: (err) => {
                this.isSaving = false;
                console.error('Error saving product', err);
                this.notificationService.error('Failed to save product');
            }
        });
    }

    deleteProduct(id: number): void {
        this.notificationService.confirm('Are you sure you want to delete this product?').then(confirmed => {
            if (confirmed) {
                this.isSaving = true;
                this.productService.deleteProduct(id).subscribe({
                    next: () => {
                        this.isSaving = false;
                        this.loadProducts();
                        this.notificationService.success('Product deleted successfully');
                    },
                    error: (err) => {
                        this.isSaving = false;
                        console.error('Error deleting product', err);
                        this.notificationService.error('Failed to delete product');
                    }
                });
            }
        });
    }
}
