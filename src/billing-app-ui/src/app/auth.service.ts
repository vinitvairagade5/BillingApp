import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface User {
    id: number;
    username: string;
    shopName: string;
    address?: string;
    gstin?: string;
    logoUrl?: string;
    gstRates?: string;
    subscriptionType?: string;
    subscriptionExpiry?: string;
    referralCode?: string;
    referredById?: number;
    passwordHash?: string;
    isAdmin?: boolean;
    upiId?: string;
}

export interface AuthResponse {
    token: string;
    expiry: string;
    user: User;
}

export interface ApiResult<T> {
    success: boolean;
    data: T;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);

    private apiUrl = `${environment.apiUrl}/Auth`;

    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() { }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    login(username: string, passwordHash: string): Observable<ApiResult<AuthResponse>> {
        return this.http.post<ApiResult<AuthResponse>>(`${this.apiUrl}/login`, { username, passwordHash }).pipe(
            tap(result => {
                if (result.success && result.data) {
                    this.setAuthData(result.data);
                }
            })
        );
    }

    register(user: Partial<User>): Observable<ApiResult<number>> {
        return this.http.post<ApiResult<number>>(`${this.apiUrl}/register`, user);
    }

    refreshProfile(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
            tap(user => this.setUser(user))
        );
    }

    updateProfile(user: User): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, user).pipe(
            tap(() => this.setUser(user))
        );
    }

    changePassword(passwordData: any): Observable<ApiResult<boolean>> {
        return this.http.post<ApiResult<boolean>>(`${this.apiUrl}/change-password`, passwordData);
    }

    logout() {
        localStorage.removeItem('billpro_user');
        this.currentUserSubject.next(null);
    }

    private setAuthData(authData: AuthResponse) {
        localStorage.setItem('billpro_user', JSON.stringify(authData));
        this.currentUserSubject.next(authData.user);
    }

    private setUser(user: User) {
        const authDataJson = localStorage.getItem('billpro_user');
        if (authDataJson) {
            const authData = JSON.parse(authDataJson) as AuthResponse;
            authData.user = user;
            localStorage.setItem('billpro_user', JSON.stringify(authData));
        }
        this.currentUserSubject.next(user);
    }

    private getUserFromStorage(): User | null {
        const authDataJson = localStorage.getItem('billpro_user');
        if (authDataJson) {
            const authData = JSON.parse(authDataJson) as AuthResponse;
            return authData.user;
        }
        return null;
    }
}
