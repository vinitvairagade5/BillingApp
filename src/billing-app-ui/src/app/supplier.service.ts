import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import { PaginatedResult } from './models/paginated-result';

export interface Supplier {
    id?: number;
    name: string;
    mobile: string;
    address?: string;
    gstin?: string;
    shopOwnerId: number;
}


@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Supplier`;

    getSuppliers(page: number = 1, pageSize: number = 10): Observable<PaginatedResult<Supplier>> {
        return this.http.get<PaginatedResult<Supplier>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
    }

    searchSuppliers(mobile: string): Observable<Supplier[]> {
        return this.http.get<Supplier[]>(`${this.apiUrl}/search?mobile=${mobile}`);
    }

    createOrUpdateSupplier(supplier: Supplier): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, supplier);
    }
}
