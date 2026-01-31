import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import { PaginatedResult } from './models/paginated-result';

export interface Customer {
    id?: number;
    name: string;
    mobile: string;
    address?: string;
    shopOwnerId: number;
}


@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Customer`;

    getCustomers(page: number = 1, pageSize: number = 10): Observable<PaginatedResult<Customer>> {
        return this.http.get<PaginatedResult<Customer>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
    }

    searchCustomers(mobile: string): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.apiUrl}/search?mobile=${mobile}`);
    }

    createOrUpdateCustomer(customer: Customer): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, customer);
    }
}
