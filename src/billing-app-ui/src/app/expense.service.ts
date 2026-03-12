import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

import { PaginatedResult } from './models/paginated-result';

export interface Expense {
    id?: number;
    category: string;
    amount: number;
    notes?: string;
    date: Date;
    shopOwnerId: number;
}

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Expense`;

    getExpenses(page: number = 1, pageSize: number = 10): Observable<PaginatedResult<Expense>> {
        return this.http.get<PaginatedResult<Expense>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
    }

    createExpense(expense: Expense): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, expense);
    }

    deleteExpense(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
