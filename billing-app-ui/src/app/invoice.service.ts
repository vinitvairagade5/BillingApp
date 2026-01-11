import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bill {
    id: number;
    billNumber: string;
    date: string;
    customer: {
        name: string;
    } | null;
    totalAmount: number;
}

export interface Customer {
    id: number;
    name: string;
    mobile: string;
    address?: string;
}

export interface Item {
    id: number;
    name: string;
    price: number;
    hsnCode?: string;
    gstRate: number;
}

export interface BillItem {
    itemId: number;
    itemName: string;
    price: number;
    quantity: number;
    hsnCode?: string;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

export interface CreateBill {
    shopOwnerId: number;
    customerId: number;
    date: string;
    subTotal: number;
    discount: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalAmount: number;
    items: BillItem[];
}

@Injectable({
    providedIn: 'root'
})
export class InvoiceService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5017/api/Invoice';

    getBills(shopOwnerId: number): Observable<Bill[]> {
        return this.http.get<Bill[]>(`${this.apiUrl}?shopOwnerId=${shopOwnerId}`);
    }

    getById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    downloadPdf(id: number): void {
        this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    getWhatsappUrl(id: number): Observable<{ url: string }> {
        return this.http.get<{ url: string }>(`${this.apiUrl}/${id}/whatsapp`);
    }

    searchCustomers(shopOwnerId: number, query: string): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${this.apiUrl}/customers/search?shopOwnerId=${shopOwnerId}&query=${query}`);
    }

    searchItems(shopOwnerId: number, query: string): Observable<Item[]> {
        return this.http.get<Item[]>(`${this.apiUrl}/items/search?shopOwnerId=${shopOwnerId}&query=${query}`);
    }

    createInvoice(bill: CreateBill): Observable<{ id: number, billNumber: string }> {
        return this.http.post<{ id: number, billNumber: string }>(this.apiUrl, bill);
    }

    getDashboardStats(shopOwnerId: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard?shopOwnerId=${shopOwnerId}`);
    }
}
