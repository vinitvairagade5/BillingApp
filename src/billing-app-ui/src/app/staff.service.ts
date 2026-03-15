import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Staff {
    id: number;
    username: string;
    role: string;
    createdAt: Date;
    accessibleMenus?: string;
}

@Injectable({ providedIn: 'root' })
export class StaffService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Staff`;

    getStaff(): Observable<Staff[]> {
        return this.http.get<Staff[]>(this.apiUrl);
    }

    addStaff(request: any): Observable<{ id: number }> {
        return this.http.post<{ id: number }>(this.apiUrl, request);
    }

    updateStaffAccess(id: number, accessibleMenus: string[]): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/access`, { accessibleMenus });
    }

    deleteStaff(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
