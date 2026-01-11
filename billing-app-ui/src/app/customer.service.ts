import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    private apiUrl = 'http://localhost:5017/api/Customer';

    getCustomers(shopOwnerId: number): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.apiUrl}?shopOwnerId=${shopOwnerId}`);
    }

    searchCustomers(mobile: string, shopOwnerId: number): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.apiUrl}/search?mobile=${mobile}&shopOwnerId=${shopOwnerId}`);
    }

    createOrUpdateCustomer(customer: Customer): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, customer);
    }
}
