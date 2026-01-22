import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Item {
    id?: number;
    name: string;
    price: number;
    category?: string;
    hsnCode?: string;
    gstRate: number;
    shopOwnerId: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Product`;

    getProducts(shopOwnerId: number): Observable<Item[]> {
        return this.http.get<Item[]>(`${this.apiUrl}?shopOwnerId=${shopOwnerId}`);
    }

    createProduct(product: Item): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, product);
    }

    updateProduct(product: Item): Observable<any> {
        return this.http.put(this.apiUrl, product);
    }

    deleteProduct(id: number, shopOwnerId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}?shopOwnerId=${shopOwnerId}`);
    }
}
