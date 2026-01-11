import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface User {
    id: number;
    username: string;
    shopName: string;
    address?: string;
    gstin?: string;
    logoUrl?: string;
    gstRates?: string;
    passwordHash?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5017/api/Auth';

    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() { }

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    login(username: string, passwordHash: string): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/login`, { username, passwordHash }).pipe(
            tap(user => this.setUser(user))
        );
    }

    register(user: Partial<User>): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(`${this.apiUrl}/register`, user);
    }

    updateProfile(user: User): Observable<any> {
        return this.http.put(`${this.apiUrl}/profile`, user).pipe(
            tap(() => this.setUser(user))
        );
    }

    logout() {
        localStorage.removeItem('billpro_user');
        this.currentUserSubject.next(null);
    }

    private setUser(user: User) {
        localStorage.setItem('billpro_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
    }

    private getUserFromStorage(): User | null {
        const userJson = localStorage.getItem('billpro_user');
        return userJson ? JSON.parse(userJson) : null;
    }
}
