import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ApiResult } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Subscription`;

    redeemCode(code: string): Observable<ApiResult<boolean>> {
        return this.http.post<ApiResult<boolean>>(`${this.apiUrl}/redeem`, `"${code}"`, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    getReferralCode(): Observable<{ code: string }> {
        return this.http.get<{ code: string }>(`${this.apiUrl}/referral-code`);
    }

    getStatus(): Observable<{ isPro: boolean }> {
        return this.http.get<{ isPro: boolean }>(`${this.apiUrl}/status`);
    }
}
