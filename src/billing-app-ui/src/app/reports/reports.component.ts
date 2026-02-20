import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportService } from '../report.service';

@Component({
   selector: 'app-reports',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule],
   template: `
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Account & Tax Reports</h1>
          <p class="text-secondary small mb-0">Download professionally formatted Excel reports for your business auditing</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Date Selector Card -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-light">
            <div class="d-flex align-items-center gap-2 mb-4">
              <span class="fs-4">📅</span>
              <h5 class="mb-0 fw-bold">Select Date Range</h5>
            </div>
            
            <form [formGroup]="rangeForm">
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">From Date</label>
                <input type="date" formControlName="start" class="form-control rounded-3 p-3 shadow-none">
              </div>
              <div class="mb-4">
                <label class="form-label small fw-bold text-muted text-uppercase tracking-wider">To Date</label>
                <input type="date" formControlName="end" class="form-control rounded-3 p-3 shadow-none">
              </div>
            </form>
            
            <div class="alert alert-info border-0 rounded-3 d-flex align-items-start gap-3 mb-0">
              <span class="fs-5">ℹ️</span>
              <p class="small mb-0 fw-medium">All exported reports automatically include your shop identity and active GST configuration.</p>
            </div>
          </div>
        </div>

        <!-- Report Options -->
        <div class="col-lg-8">
          <div class="row g-4">
            <!-- Sales Summary -->
            <div class="col-md-6">
              <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-lift">
                <div class="card-body p-4">
                  <div class="rounded-4 bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center mb-4" style="width: 56px; height: 56px; font-size: 1.5rem;">
                    💰
                  </div>
                  <h5 class="fw-bold text-dark mb-2">Sales Summary Report</h5>
                  <p class="text-muted small mb-4">Comprehensive list of invoices, payment performance, and customer lifetime value.</p>
                  
                  <div class="small fw-medium text-dark">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="text-success small">✓</span> Daily sales breakdown
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="text-success small">✓</span> Payment method tracking
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span class="text-success small">✓</span> Customer-wise subtotals
                    </div>
                  </div>
                </div>
                <div class="card-footer bg-white border-0 p-4 pt-0">
                  <button class="btn btn-primary w-100 rounded-pill py-3 fw-bold shadow-sm" (click)="onDownloadSales()" [disabled]="rangeForm.invalid">
                    Download Sales (.xlsx)
                  </button>
                </div>
              </div>
            </div>

            <!-- GST Report -->
            <div class="col-md-6">
              <div class="card border-0 shadow-sm rounded-4 h-100 overflow-hidden bg-white hover-lift">
                <div class="card-body p-4">
                  <div class="rounded-4 bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-4" style="width: 56px; height: 56px; font-size: 1.5rem;">
                    🧾
                  </div>
                  <h5 class="fw-bold text-dark mb-2">GST Return Report</h5>
                  <p class="text-muted small mb-4">Precision-formatted data optimized for monthly tax filing and audits.</p>
                  
                  <div class="small fw-medium text-dark">
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="text-success small">✓</span> CGST/SGST/IGST breakdown
                    </div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                      <span class="text-success small">✓</span> HSN-level details
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <span class="text-success small">✓</span> CA-ready format
                    </div>
                  </div>
                </div>
                <div class="card-footer bg-white border-0 p-4 pt-0">
                  <button class="btn btn-outline-primary w-100 rounded-pill py-3 fw-bold" (click)="onDownloadGst()" [disabled]="rangeForm.invalid">
                    Download GST Report (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
   styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    .hover-lift { transition: transform 0.2s ease; border: 1px solid transparent !important; }
    .hover-lift:hover { transform: translateY(-5px); border-color: rgba(var(--bs-primary-rgb), 0.1) !important; }
    
    .tracking-wider { letter-spacing: 0.1em; }
    
    .form-control:focus {
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.1);
      border-color: #0d6efd;
    }
  `]
})
export class ReportDashboardComponent implements OnInit {
   private fb = inject(FormBuilder);
   private reportService = inject(ReportService);

   rangeForm = this.fb.group({
      start: ['', Validators.required],
      end: ['', Validators.required]
   });

   ngOnInit() {
      // Default range: First day of current month to today
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

      this.rangeForm.patchValue({
         start: firstDay.toISOString().split('T')[0],
         end: now.toISOString().split('T')[0]
      });
   }

   onDownloadSales() {
      const { start, end } = this.rangeForm.value;
      if (start && end) {
         this.reportService.downloadSalesReport(start, end);
      }
   }

   onDownloadGst() {
      const { start, end } = this.rangeForm.value;
      if (start && end) {
         this.reportService.downloadGstReport(start, end);
      }
   }
}
