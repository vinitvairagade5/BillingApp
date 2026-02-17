import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, finalize } from 'rxjs/operators';

export interface ApiResult<T> {
    success: boolean;
    data: T;
    message?: string;
    errorCode?: string;
}

@Injectable({
    providedIn: 'root'
})
export class BaseApiService {
    protected http = inject(HttpClient);

    // Global loading state can be injected here
    private isLoading = false;

    get<T>(url: string): Observable<T> {
        return this.http.get<ApiResult<T>>(url).pipe(
            map(res => this.handleSuccess(res)),
            catchError(err => this.handleError(err))
        );
    }

    post<T>(url: string, body: any): Observable<T> {
        return this.http.post<ApiResult<T>>(url, body).pipe(
            map(res => this.handleSuccess(res)),
            catchError(err => this.handleError(err))
        );
    }

    put<T>(url: string, body: any): Observable<T> {
        return this.http.put<ApiResult<T>>(url, body).pipe(
            map(res => this.handleSuccess(res)),
            catchError(err => this.handleError(err))
        );
    }

    delete<T>(url: string): Observable<T> {
        return this.http.delete<ApiResult<T>>(url).pipe(
            map(res => this.handleSuccess(res)),
            catchError(err => this.handleError(err))
        );
    }

    private handleSuccess<T>(result: ApiResult<T>): T {
        if (result.success) return result.data;
        throw new Error(result.message || 'API Error');
    }

    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'An unknown error occurred!';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Error: ${error.error.message}`;
        } else {
            errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => errorMessage);
    }
}
