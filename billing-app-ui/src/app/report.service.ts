import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/Report`;

    downloadSalesReport(start: string, end: string): void {
        this.http.get(`${this.apiUrl}/sales-summary?start=${start}&end=${end}`, { responseType: 'blob' })
            .subscribe(blob => this.triggerDownload(blob, `Sales_Summary_${start}_to_${end}.xlsx`));
    }

    downloadGstReport(start: string, end: string): void {
        this.http.get(`${this.apiUrl}/gst-report?start=${start}&end=${end}`, { responseType: 'blob' })
            .subscribe(blob => this.triggerDownload(blob, `GST_Report_${start}_to_${end}.xlsx`));
    }

    private triggerDownload(blob: Blob, fileName: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}
