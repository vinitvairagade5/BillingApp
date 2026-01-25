import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ApiResult } from './auth.service';

export interface ActivationCode {
    id: number;
    code: string;
    durationDays: number;
    isRedeemed: boolean;
    redeemedByUserId?: number;
    redeemedAt?: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Admin`;

    generateCodes(count: number, durationDays: number): Observable<ApiResult<ActivationCode[]>> {
        return this.http.post<ApiResult<ActivationCode[]>>(`${this.apiUrl}/generate-codes`, { count, durationDays });
    }

    getAllCodes(): Observable<ActivationCode[]> {
        return this.http.get<ActivationCode[]>(`${this.apiUrl}/codes`);
    }
}
