import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Item } from '../product.service';
import { AuthService } from '../auth.service';

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

    products: Item[] = [];
    searchTerm: string = '';
    isModalOpen: boolean = false;
    editingProduct: Item | null = null;

    newProduct: Item = {
        name: '',
        price: 0,
        category: '',
        hsnCode: '',
        gstRate: 18,
        shopOwnerId: 0
    };

    ngOnInit(): void {
        const user = this.authService.currentUserValue;
        if (user) {
            this.newProduct.shopOwnerId = user.id;
            this.loadProducts();
        }
    }

    loadProducts(): void {
        const user = this.authService.currentUserValue;
        if (user) {
            this.productService.getProducts(user.id).subscribe(data => {
                this.products = data;
            });
        }
    }

    get filteredProducts(): Item[] {
        return this.products.filter(p =>
            p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(this.searchTerm.toLowerCase()))
        );
    }

    openAddModal(): void {
        this.editingProduct = null;
        const user = this.authService.currentUserValue;
        this.newProduct = {
            name: '',
            price: 0,
            category: '',
            hsnCode: '',
            gstRate: 18,
            shopOwnerId: user?.id || 0
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
        if (this.editingProduct) {
            this.productService.updateProduct(this.newProduct).subscribe(() => {
                this.loadProducts();
                this.closeModal();
            });
        } else {
            this.productService.createProduct(this.newProduct).subscribe(() => {
                this.loadProducts();
                this.closeModal();
            });
        }
    }

    deleteProduct(id: number): void {
        if (confirm('Are you sure you want to delete this product?')) {
            const user = this.authService.currentUserValue;
            if (user) {
                this.productService.deleteProduct(id, user.id).subscribe(() => {
                    this.loadProducts();
                });
            }
        }
    }
}
