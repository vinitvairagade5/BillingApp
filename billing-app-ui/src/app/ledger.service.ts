import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ApiResult } from './auth.service';

export interface LedgerEntry {
    id: number;
    customerId: number;
    billId?: number;
    date: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description: string;
}

export interface CustomerBalance {
    customerId: number;
    name: string;
    mobile: string;
    balance: number;
}

@Injectable({
    providedIn: 'root'
})
export class LedgerService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Ledger`;

    getBalances(): Observable<CustomerBalance[]> {
        return this.http.get<CustomerBalance[]>(`${this.apiUrl}/balances`);
    }

    getCustomerLedger(customerId: number): Observable<{ balance: number, history: LedgerEntry[] }> {
        return this.http.get<{ balance: number, history: LedgerEntry[] }>(`${this.apiUrl}/customer/${customerId}`);
    }

    addManualEntry(entry: Partial<LedgerEntry>): Observable<ApiResult<boolean>> {
        return this.http.post<ApiResult<boolean>>(`${this.apiUrl}/manual-entry`, entry);
    }
}
