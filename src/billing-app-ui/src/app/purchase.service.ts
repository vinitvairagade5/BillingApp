import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PurchaseItem {
    itemId: number;
    itemName?: string;
    purchasePrice: number;
    quantity: number;
}

export interface Purchase {
    id?: number;
    supplierId: number;
    supplierName?: string;
    totalAmount: number;
    paidAmount: number;
    date: Date;
    items: PurchaseItem[];
}

@Injectable({ providedIn: 'root' })
export class PurchaseService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Purchase`;

    getPurchases(page: number = 1, pageSize: number = 20): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
    }

    createPurchase(data: Purchase): Observable<any> {
        return this.http.post<{ id: number }>(this.apiUrl, data);
    }
}
