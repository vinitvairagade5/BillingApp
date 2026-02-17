import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportService } from '../report.service';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="reports-page animation-fade-in">
      <header class="page-header">
        <div>
          <h1>Account & Tax Reports</h1>
          <p class="subtitle">Download professionally formatted Excel reports for your CA</p>
        </div>
      </header>

      <div class="reports-grid">
        <!-- Date Selector Card -->
        <aside class="sidebar-filters">
           <section class="section glass card">
              <div class="section-header">
                 <span class="icon">📅</span>
                 <h3>Select Date Range</h3>
              </div>
              <form [formGroup]="rangeForm" class="range-form">
                 <div class="form-group">
                    <label>From Date</label>
                    <input type="date" formControlName="start" class="premium-input">
                 </div>
                 <div class="form-group">
                    <label>To Date</label>
                    <input type="date" formControlName="end" class="premium-input">
                 </div>
              </form>
              <div class="info-box glass mt-4">
                 <span class="info-icon">ℹ️</span>
                 <p>All reports exported include your shop details and GST rates.</p>
              </div>
           </section>
        </aside>

        <!-- Report Options -->
        <div class="main-content">
           <div class="report-cards">
              <!-- Sales Summary -->
              <div class="report-card glass card">
                 <div class="card-body">
                    <div class="report-icon sales">💰</div>
                    <div class="report-info">
                       <h3>Sales Summary Report</h3>
                       <p>Detailed list of invoices, payments, and customer totals.</p>
                       <ul class="feat-list">
                          <li>✅ Daily sales breakdown</li>
                          <li>✅ Payment method tracking</li>
                          <li>✅ Customer-wise subtotals</li>
                       </ul>
                    </div>
                 </div>
                 <div class="card-footer">
                    <button class="btn btn-primary btn-block" (click)="onDownloadSales()" [disabled]="rangeForm.invalid">
                       Download Sales (.xlsx)
                    </button>
                 </div>
              </div>

              <!-- GST Report -->
              <div class="report-card glass card">
                 <div class="card-body">
                    <div class="report-icon gst">🧾</div>
                    <div class="report-info">
                       <h3>GST Return Report</h3>
                       <p>Optimized for monthly tax filing and audits.</p>
                       <ul class="feat-list">
                          <li>✅ CGST/SGST/IGST separation</li>
                          <li>✅ HSN-level details</li>
                          <li>✅ B2B and B2C compatibility</li>
                       </ul>
                    </div>
                 </div>
                 <div class="card-footer">
                    <button class="btn btn-secondary btn-block" (click)="onDownloadGst()" [disabled]="rangeForm.invalid">
                       Download GST Report (.xlsx)
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .reports-page { padding-bottom: 40px; }
    .page-header { margin-bottom: 32px; background: white; padding: 24px 32px; border-radius: 24px; }
    .page-header h1 { margin: 0; font-size: 32px; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; }

    .reports-grid { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: start; }
    
    .section { padding: 32px; border-radius: 24px; }
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .section-header h3 { margin: 0; font-size: 18px; }

    .range-form { display: flex; flex-direction: column; gap: 20px; }
    .form-group label { display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
    .premium-input { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 14px; width: 100%; box-sizing: border-box; }

    .info-box { display: flex; gap: 12px; padding: 16px; border-radius: 12px; background: #eff6ff; border: 1px solid #dbeafe; }
    .info-icon { font-size: 18px; display: inline-block; }
    .info-box p { margin: 0; font-size: 12px; color: #1e3a8a; font-weight: 500; line-height: 1.5; }

    .report-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .report-card { padding: 24px; border-radius: 24px; display: flex; flex-direction: column; height: 100%; }
    .card-body { flex: 1; display: flex; gap: 20px; }
    
    .report-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .report-icon.sales { color: #f59e0b; background: #fffbeb; border-color: #fef3c7; }
    .report-icon.gst { color: #3b82f6; background: #eff6ff; border-color: #dbeafe; }

    .report-info h3 { margin: 0 0 8px 0; font-size: 20px; }
    .report-info p { margin: 0 0 20px 0; color: #64748b; font-size: 14px; line-height: 1.5; }
    
    .feat-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .feat-list li { font-size: 13px; font-weight: 600; color: #475569; }

    .card-footer { margin-top: 32px; }
    .btn-block { width: 100%; padding: 14px; border-radius: 14px; font-weight: 700; cursor: pointer; }

    .mt-4 { margin-top: 24px; }
    .animation-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
