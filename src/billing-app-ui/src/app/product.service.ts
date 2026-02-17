import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import { PaginatedResult } from './models/paginated-result';

export interface Item {
    id?: number;
    name: string;
    price: number;
    category?: string;
    hsnCode?: string;
    gstRate: number;
    shopOwnerId: number;
    stockQuantity: number;
    lowStockThreshold: number;
}


@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Product`;

    getProducts(page: number = 1, pageSize: number = 10, search: string = ''): Observable<PaginatedResult<Item>> {
        let url = `${this.apiUrl}?page=${page}&pageSize=${pageSize}`;
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }
        return this.http.get<PaginatedResult<Item>>(url);
    }

    createProduct(product: Item): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, product);
    }

    updateProduct(product: Item): Observable<any> {
        return this.http.put(this.apiUrl, product);
    }

    deleteProduct(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
