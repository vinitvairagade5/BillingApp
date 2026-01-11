import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InvoiceService, Customer, Item, CreateBill } from '../invoice.service';
import { CustomerService } from '../customer.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="invoice-page animation-fade-in">
      <header class="page-header">
        <div class="header-info">
          <h1>Create New Invoice</h1>
          <p class="subtitle">Enter details to generate a professional GST invoice</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn btn-secondary" routerLink="/">Cancel</button>
          <button 
            type="button" 
            class="btn btn-success btn-lg shadow-vibrant" 
            (click)="onSubmit()" 
            [disabled]="invoiceForm.invalid || !selectedCustomer || isSubmitting"
          >
            <span class="icon">{{ isSubmitting ? '⏳' : '💾' }}</span> 
            {{ isSubmitting ? 'Saving...' : 'Save & Generate' }}
          </button>
        </div>
      </header>

      <div class="invoice-grid">
        <!-- Main Form Column -->
        <div class="form-main">
          <!-- Customer Section -->
          <section class="section glass card">
            <div class="section-header">
              <span class="step-num">1</span>
              <h3>Customer Details</h3>
            </div>
            
            <div class="field-group">
              <div class="form-group search-wrapper">
                <label>Find Customer</label>
                <div class="search-input-container">
                  <span class="search-icon">🔍</span>
                  <input 
                    type="text" 
                    id="customerSearch" 
                    class="form-control premium-input" 
                    placeholder="Search by Name or Mobile..."
                    (input)="onCustomerSearch($event)"
                    autocomplete="off"
                  >
                </div>
                <!-- Search Results Dropdown -->
                <div class="dropdown glass" *ngIf="customerResults.length > 0 || (customerSearchQuery && customerSearchQuery.length >= 2)">
                  <div 
                    *ngFor="let c of customerResults" 
                    (click)="selectCustomer(c)"
                    class="dropdown-item"
                  >
                    <div class="item-name">{{ c.name }}</div>
                    <div class="item-meta">{{ c.mobile }}</div>
                  </div>
                  <div class="dropdown-item quick-add-btn" (click)="openQuickCustomerModal()">
                    <span class="icon">➕</span> Add "{{ customerSearchQuery }}" as new customer
                  </div>
                </div>
              </div>

              <div class="selected-customer-card" *ngIf="selectedCustomer">
                <div class="cust-avatar">{{ selectedCustomer.name.charAt(0) }}</div>
                <div class="cust-details">
                  <h4>{{ selectedCustomer.name }}</h4>
                  <p>{{ selectedCustomer.mobile }}</p>
                  <small>{{ selectedCustomer.address }}</small>
                </div>
                <button type="button" class="btn-text-danger" (click)="selectedCustomer = null; invoiceForm.patchValue({customerId: null})">Change</button>
              </div>
            </div>
          </section>

          <!-- Items Section -->
          <form [formGroup]="invoiceForm" class="form-items-container">
            <section class="section glass card">
              <div class="section-header">
                <span class="step-num">2</span>
                <h3>Invoice Items</h3>
              </div>
              
              <div class="items-table-wrapper" formArrayName="items">
                <div class="item-row-header">
                  <span class="col-name">Item Name / Search</span>
                  <span class="col-price">Price</span>
                  <span class="col-qty">Qty</span>
                  <span class="col-gst">GST %</span>
                  <span class="col-total">Total</span>
                  <span class="col-action"></span>
                </div>

                <div class="item-row" *ngFor="let item of items.controls; let i=index" [formGroupName]="i">
                  <div class="col-name search-wrapper">
                    <input 
                      formControlName="itemName" 
                      class="form-control premium-input" 
                      placeholder="Search item..."
                      (input)="onItemSearch($event, i)"
                      autocomplete="off"
                    >
                    <div class="dropdown glass" *ngIf="itemSearchIndex === i && itemResults.length > 0">
                      <div 
                        *ngFor="let res of itemResults" 
                        (click)="selectItem(res, i)"
                        class="dropdown-item"
                      >
                        <div class="item-name">{{ res.name }}</div>
                        <div class="item-meta">₹{{ res.price }} • HSN: {{ res.hsnCode }}</div>
                      </div>
                    </div>
                  </div>
                  <div class="col-price">
                    <input type="number" formControlName="price" class="form-control premium-input" (input)="calculateItemTotal(i)">
                  </div>
                  <div class="col-qty">
                    <input type="number" formControlName="quantity" class="form-control premium-input" (input)="calculateItemTotal(i)">
                  </div>
                  <div class="col-gst">
                    <select formControlName="gstRate" class="form-control premium-input" (change)="calculateItemTotal(i)">
                      <option *ngFor="let rate of availableGstRates" [value]="rate">{{ rate }}%</option>
                    </select>
                  </div>
                  <div class="col-total">
                    <span class="item-total-val">₹{{ item.get('total')?.value | number:'1.2-2' }}</span>
                  </div>
                  <div class="col-action">
                    <button type="button" class="btn-icon-delete" (click)="removeItem(i)" *ngIf="items.length > 1" title="Remove Item">🗑️</button>
                  </div>
                </div>
              </div>

              <button type="button" class="btn btn-outline" (click)="addItem()">
                <span class="icon">➕</span> Add Another Item
              </button>
            </section>
          </form>
        </div>

        <!-- Sidebar Summary Column -->
        <aside class="form-sidebar">
          <section class="summary-card glass card">
            <h3>Invoice Summary</h3>
            
            <div class="summary-details">
              <div class="summary-line">
                <span>Subtotal</span>
                <span>₹{{ invoiceForm.get('subTotal')?.value | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line">
                <span>CGST (Intra-state)</span>
                <span>₹{{ invoiceForm.get('totalCGST')?.value | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line">
                <span>SGST (Intra-state)</span>
                <span>₹{{ invoiceForm.get('totalSGST')?.value | number:'1.2-2' }}</span>
              </div>
              <div class="divider"></div>
              <div class="summary-line grand-total">
                <span>Total Amount</span>
                <span>₹{{ invoiceForm.get('totalAmount')?.value | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="validation-box" *ngIf="(invoiceForm.invalid || !selectedCustomer) && !isSubmitting">
               <p class="error-msg" *ngIf="!selectedCustomer"><span class="icon">⚠️</span> Select a customer (Step 1)</p>
               <p class="error-msg" *ngIf="items.invalid"><span class="icon">⚠️</span> Fill item details (Step 2)</p>
            </div>

            <button type="button" class="btn btn-success btn-block btn-lg shadow-vibrant" (click)="onSubmit()" [disabled]="invoiceForm.invalid || !selectedCustomer || isSubmitting">
              <span class="icon">{{ isSubmitting ? '⏳' : '💾' }}</span> 
              {{ isSubmitting ? 'Saving...' : 'Save & Generate PDF' }}
            </button>
          </section>
          
          <div class="preview-tip card glass">
            <span class="icon">💡</span>
            <p>Invoices are generated using the Indian GST format complying with HSN standards.</p>
          </div>
        </aside>
      </div>
    </div>

    <!-- Quick Add Customer Modal -->
    <div class="modal-overlay" *ngIf="showQuickCustomerModal">
      <div class="quick-modal glass card animation-fade-in">
        <div class="modal-header">
          <h3>Quick Add Customer</h3>
          <button class="btn-close" (click)="closeQuickCustomerModal()">×</button>
        </div>
        <form [formGroup]="quickCustomerForm" (ngSubmit)="saveQuickCustomer()" class="quick-form">
          <div class="form-group">
            <label>Name</label>
            <input type="text" formControlName="name" class="form-control premium-input" placeholder="Full Name">
          </div>
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="text" formControlName="mobile" class="form-control premium-input" placeholder="10-digit Mobile">
          </div>
          <div class="form-group">
            <label>Address (Optional)</label>
            <textarea formControlName="address" class="form-control premium-input" rows="2" placeholder="Full Address"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeQuickCustomerModal()">Cancel</button>
            <button type="submit" class="btn btn-success" [disabled]="quickCustomerForm.invalid">Save & Select</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success & Share Modal -->
    <div class="modal-overlay success-modal-overlay" *ngIf="showSuccessModal">
      <div class="success-modal glass card animation-bounce">
        <div class="success-icon-wrapper">
          <div class="success-icon">✅</div>
        </div>
        <h2>Invoice Created!</h2>
        <p class="bill-num-badge">{{ createdBillNumber }}</p>
        <p class="success-msg">Your invoice has been generated successfully and is ready to share.</p>
        
        <div class="share-actions">
          <button class="btn share-btn-view" (click)="viewInvoice()">
            <span class="icon">👁️</span> View Invoice
          </button>
          <button class="btn share-btn-whatsapp" (click)="shareOnWhatsapp()">
            <span class="icon">📱</span> Share on WhatsApp
          </button>
          <button class="btn share-btn-pdf" (click)="downloadPdf()">
            <span class="icon">📄</span> Download PDF
          </button>
        </div>

        <div class="modal-divider"><span>OR</span></div>

        <div class="footer-actions">
          <button class="btn btn-outline-vibrant" (click)="resetForm()">
            <span class="icon">➕</span> Create Another
          </button>
          <button class="btn btn-secondary" (click)="goToBills()">
            <span class="icon">📋</span> View All Bills
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoice-page { padding: 40px; padding-bottom: 100px; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; background: white; padding: 24px 32px; border-radius: 24px; box-shadow: var(--shadow-sm); }
    .page-header h1 { margin: 0; font-size: 32px; letter-spacing: -0.02em; }
    .subtitle { color: #64748b; margin: 4px 0 0 0; font-size: 15px; }
    .header-actions { display: flex; gap: 16px; }

    .invoice-grid { display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start; }
    
    .section { padding: 32px; margin-bottom: 24px; border-radius: 24px; }
    .section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .step-num { width: 36px; height: 36px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; box-shadow: 0 4px 10px var(--primary-glow); }
    .section h3 { margin: 0; font-size: 22px; }

    /* Inputs */
    .premium-input { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; font-size: 14px; transition: var(--transition); width: 100%; box-sizing: border-box; }
    .premium-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px var(--primary-glow); outline: none; }

    /* Search Dropdown */
    .search-wrapper { position: relative; }
    .search-input-container { position: relative; }
    .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input-container input { padding-left: 48px; width: 100%; }
    
    .dropdown { position: absolute; top: calc(100% + 8px); left: 0; right: 0; border-radius: 16px; border: 1px solid var(--border-color); z-index: 1000; overflow: hidden; background: white; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
    .dropdown-item { padding: 14px 18px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: var(--transition); }
    .dropdown-item:hover { background: #f8fafc; }
    .dropdown-item.quick-add-btn { background: #f0f9ff; color: var(--primary); font-weight: 700; display: flex; align-items: center; gap: 8px; border-bottom: none; cursor: pointer; }
    .dropdown-item.quick-add-btn:hover { background: #e0f2fe; }
    .dropdown-item .item-name { font-weight: 600; color: #1e293b; }
    .dropdown-item .item-meta { font-size: 12px; color: #64748b; }

    /* Validation Box */
    .validation-box { background: #fff5f5; border: 1px solid #fed7d7; padding: 16px; border-radius: 16px; margin-bottom: 20px; }
    .error-msg { color: #c53030; font-size: 13px; font-weight: 600; margin: 6px 0; display: flex; align-items: center; gap: 8px; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .quick-modal { width: 100%; max-width: 480px; padding: 32px; background: white; border-radius: 24px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .modal-header h3 { margin: 0; font-size: 24px; }
    .btn-close { background: none; border: none; font-size: 32px; color: #94a3b8; cursor: pointer; line-height: 1; }
    .quick-form .form-group { margin-bottom: 20px; }
    .quick-form label { display: block; font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 10px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }

    /* Success Modal Specifics */
    .success-modal { width: 100%; max-width: 520px; text-align: center; padding: 48px 40px; border-radius: 32px; }
    .success-icon-wrapper { width: 80px; height: 80px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; border: 4px solid #d1fae5; }
    .success-icon { font-size: 40px; }
    .success-modal h2 { font-size: 28px; margin-bottom: 12px; color: #065f46; }
    .bill-num-badge { display: inline-block; padding: 8px 16px; background: #f0f9ff; color: #0369a1; border-radius: 100px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 16px; border: 1px solid #bae6fd; }
    .success-msg { color: #64748b; font-size: 16px; margin-bottom: 40px; line-height: 1.5; }
    
    .share-actions { display: grid; gap: 16px; margin-bottom: 24px; }
    .share-btn-view { background: #eff6ff; color: #1e40af; border: 2px solid #dbeafe; padding: 18px; font-size: 18px; width: 100%; border-radius: 20px; }
    .share-btn-view:hover { background: #dbeafe; transform: translateY(-2px); }
    .share-btn-whatsapp { background: #25d366; color: white; padding: 18px; font-size: 18px; width: 100%; border-radius: 20px; }
    .share-btn-whatsapp:hover { background: #128c7e; transform: translateY(-2px); box-shadow: 0 10px 15px rgba(37, 211, 102, 0.3); }
    .share-btn-pdf { background: #f8fafc; border: 2px solid #e2e8f0; color: #475569; padding: 18px; font-size: 18px; width: 100%; border-radius: 20px; }
    .share-btn-pdf:hover { background: white; border-color: var(--primary); color: var(--primary); }
    
    .modal-divider { display: flex; align-items: center; gap: 16px; color: #cbd5e1; font-weight: 700; margin: 24px 0; font-size: 14px; }
    .modal-divider::before, .modal-divider::after { content: ''; flex: 1; height: 1px; background: #f1f5f9; }
    
    .footer-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-outline-vibrant { border: 2px solid var(--primary); color: var(--primary); background: transparent; padding: 12px 20px; }
    .btn-outline-vibrant:hover { background: #f0f7ff; }

    /* Buttons General */
    .btn { padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; border: none; transition: var(--transition); display: flex; align-items: center; gap: 10px; justify-content: center; }
    .btn-lg { padding: 16px 32px; font-size: 16px; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-success { background: var(--success); color: white; }
    .btn-success:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4); }
    .btn-success:disabled { background: #cbd5e1; color: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
    .shadow-vibrant { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1); }

    /* Selected Customer */
    .selected-customer-card { display: flex; align-items: center; gap: 20px; background: #eff6ff; padding: 20px; border-radius: 20px; border: 1px solid #dbeafe; margin-top: 24px; }
    .cust-avatar { width: 56px; height: 56px; background: var(--primary); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; }
    .cust-details { flex: 1; }
    .cust-details h4 { margin: 0; font-size: 18px; color: #1e3a8a; }
    .cust-details p { margin: 4px 0; font-size: 15px; color: #3b82f6; font-weight: 600; }
    .cust-details small { font-size: 13px; color: #64748b; }
    .btn-text-danger { background: none; border: none; color: var(--danger); font-weight: 700; cursor: pointer; font-size: 14px; }

    /* Items Table Layout */
    .items-table-wrapper { margin-bottom: 32px; overflow-x: auto; }
    .item-row-header { display: grid; grid-template-columns: 2fr 140px 80px 100px 140px 40px; gap: 16px; padding: 0 0 16px 0; border-bottom: 2px solid #f1f5f9; margin-bottom: 20px; min-width: 700px; }
    .col-name { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
    
    .item-row { display: grid; grid-template-columns: 2fr 140px 80px 100px 140px 40px; gap: 16px; margin-bottom: 16px; align-items: center; min-width: 700px; }
    .item-total-val { font-weight: 800; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; }
    
    .btn-icon-delete { background: #fee2e2; border: none; font-size: 18px; cursor: pointer; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
    .btn-icon-delete:hover { background: var(--danger); color: white; transform: scale(1.1); }

    .btn-outline { background: #f8fafc; border: 2px dashed #cbd5e1; color: #64748b; width: 100%; border-radius: 16px; padding: 16px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700; cursor: pointer; transition: var(--transition); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: #f0f7ff; transform: translateY(-1px); }

    /* Sidebar Summary */
    .summary-card { padding: 32px; position: sticky; top: 40px; }
    .summary-card h3 { margin-top: 0; margin-bottom: 24px; font-size: 22px; }
    .summary-line { display: flex; justify-content: space-between; margin-bottom: 14px; color: #64748b; font-weight: 600; font-size: 15px; }
    .grand-total { font-size: 26px; color: #059669; font-weight: 900; margin-top: 20px; border-top: 2px solid #ecfdf5; padding-top: 20px; }
    .divider { height: 1px; background: #f1f5f9; margin: 20px 0; }
    
    .btn-block { width: 100%; margin-top: 16px; }

    .preview-tip { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 20px; display: flex; gap: 16px; align-items: flex-start; margin-top: 32px; border-radius: 20px; }
    .preview-tip .icon { font-size: 24px; }
    .preview-tip p { margin: 0; font-size: 14px; font-weight: 500; line-height: 1.6; }

    .animation-fade-in { animation: fadeIn 0.5s ease-out; }
    .animation-bounce { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes bounceIn { from { opacity: 0; transform: scale(0.3); } to { opacity: 1; transform: scale(1); } }

    select.premium-input { appearance: none; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E"); background-position: right 14px center; background-repeat: no-repeat; background-size: 20px; padding-right: 44px; }
  `]
})
export class InvoiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  invoiceForm!: FormGroup;
  quickCustomerForm!: FormGroup;
  selectedCustomer: Customer | null = null;
  customerResults: Customer[] = [];
  customerSearchQuery: string = '';
  itemResults: Item[] = [];
  itemSearchIndex: number | null = null;

  showQuickCustomerModal: boolean = false;
  showSuccessModal: boolean = false;
  createdBillId: number | null = null;
  createdBillNumber: string = '';
  isSubmitting: boolean = false;
  availableGstRates: number[] = [0, 5, 12, 18, 28];

  get shopOwnerId(): number {
    return this.authService.currentUserValue?.id ?? 1;
  }

  ngOnInit() {
    this.initForm();
    this.initQuickCustomerForm();
    this.addItem();

    // Load dynamic GST rates from settings
    const user = this.authService.currentUserValue;
    if (user && user.gstRates) {
      this.availableGstRates = user.gstRates.split(',').map(r => parseFloat(r)).sort((a, b) => a - b);
    }
  }

  initForm() {
    this.invoiceForm = this.fb.group({
      shopOwnerId: [this.shopOwnerId],
      customerId: [null, Validators.required],
      date: [new Date().toISOString()],
      subTotal: [0],
      discount: [0],
      totalCGST: [0],
      totalSGST: [0],
      totalIGST: [0],
      totalAmount: [0],
      items: this.fb.array([], Validators.required)
    });
  }

  initQuickCustomerForm() {
    this.quickCustomerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: [''],
      shopOwnerId: [this.shopOwnerId]
    });
  }

  get items() {
    return this.invoiceForm.get('items') as FormArray;
  }

  addItem() {
    const itemGroup = this.fb.group({
      itemId: [null],
      itemName: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      hsnCode: [''],
      gstRate: [18],
      cgst: [0],
      sgst: [0],
      igst: [0],
      total: [0]
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.calculateTotals();
  }

  onCustomerSearch(event: any) {
    const query = event.target.value;
    this.customerSearchQuery = query;
    if (query.length < 2) {
      this.customerResults = [];
      return;
    }
    this.invoiceService.searchCustomers(this.shopOwnerId, query).subscribe(res => {
      this.customerResults = res;
    });
  }

  openQuickCustomerModal() {
    this.showQuickCustomerModal = true;
    const initialName = isNaN(Number(this.customerSearchQuery)) ? this.customerSearchQuery : '';
    const initialMobile = !isNaN(Number(this.customerSearchQuery)) && this.customerSearchQuery.length <= 10 ? this.customerSearchQuery : '';

    this.quickCustomerForm.patchValue({
      name: initialName,
      mobile: initialMobile,
      shopOwnerId: this.shopOwnerId
    });
  }

  closeQuickCustomerModal() {
    this.showQuickCustomerModal = false;
    this.quickCustomerForm.reset({ shopOwnerId: this.shopOwnerId });
  }

  saveQuickCustomer() {
    if (this.quickCustomerForm.invalid) return;

    this.customerService.createOrUpdateCustomer(this.quickCustomerForm.value).subscribe({
      next: (res) => {
        const newCustomer: Customer = {
          id: res.id,
          ...this.quickCustomerForm.value
        };
        this.selectCustomer(newCustomer);
        this.closeQuickCustomerModal();
      },
      error: (err) => {
        console.error('Error saving quick customer', err);
        alert('Failed to add customer. Mobile number might already exist.');
      }
    });
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.invoiceForm.patchValue({ customerId: customer.id });
    this.customerResults = [];
    this.customerSearchQuery = '';
    const searchInput = document.getElementById('customerSearch') as HTMLInputElement;
    if (searchInput) searchInput.value = customer.name;
    this.calculateTotals();
  }

  onItemSearch(event: any, index: number) {
    const query = event.target.value;
    this.itemSearchIndex = index;
    if (query.length < 2) {
      this.itemResults = [];
      return;
    }
    this.invoiceService.searchItems(this.shopOwnerId, query).subscribe(res => {
      this.itemResults = res;
    });
  }

  selectItem(item: Item, index: number) {
    const itemGroup = this.items.at(index);
    itemGroup.patchValue({
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      hsnCode: item.hsnCode,
      gstRate: item.gstRate || 18
    });
    this.itemResults = [];
    this.itemSearchIndex = null;
    this.calculateItemTotal(index);
  }

  calculateItemTotal(index: number) {
    const itemGroup = this.items.at(index);
    const price = itemGroup.get('price')?.value || 0;
    const quantity = itemGroup.get('quantity')?.value || 0;
    const gstRate = itemGroup.get('gstRate')?.value || 0;

    const subTotal = price * quantity;
    const totalGST = (subTotal * gstRate) / 100;
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const total = subTotal + totalGST;

    itemGroup.patchValue({
      cgst: cgst,
      sgst: sgst,
      total: total
    }, { emitEvent: false });

    this.calculateTotals();
  }

  calculateTotals() {
    let subTotal = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalAmount = 0;

    this.items.controls.forEach(control => {
      const price = control.get('price')?.value || 0;
      const quantity = control.get('quantity')?.value || 0;
      subTotal += price * quantity;
      totalCGST += control.get('cgst')?.value || 0;
      totalSGST += control.get('sgst')?.value || 0;
      totalIGST += control.get('igst')?.value || 0;
      totalAmount += control.get('total')?.value || 0;
    });

    this.invoiceForm.patchValue({
      subTotal,
      totalCGST,
      totalSGST,
      totalIGST,
      totalAmount
    });
  }

  onSubmit() {
    if (this.invoiceForm.invalid || !this.selectedCustomer) return;

    this.isSubmitting = true;
    const payload: CreateBill = this.invoiceForm.value;

    this.invoiceService.createInvoice(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.createdBillId = res.id;
        this.createdBillNumber = res.billNumber;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Error creating invoice', err);
        alert('Failed to create invoice. Please check your internet or server connection.');
      }
    });
  }

  shareOnWhatsapp() {
    if (!this.createdBillId) return;
    this.invoiceService.getWhatsappUrl(this.createdBillId).subscribe(res => {
      window.open(res.url, '_blank');
    });
  }

  viewInvoice() {
    if (this.createdBillId) {
      this.router.navigate(['/bills', this.createdBillId]);
    }
  }

  downloadPdf() {
    if (!this.createdBillId) return;
    this.invoiceService.downloadPdf(this.createdBillId);
  }

  resetForm() {
    this.showSuccessModal = false;
    this.createdBillId = null;
    this.createdBillNumber = '';
    this.selectedCustomer = null;
    this.initForm();
    this.addItem();
    const searchInput = document.getElementById('customerSearch') as HTMLInputElement;
    if (searchInput) searchInput.value = '';
  }

  goToBills() {
    this.router.navigate(['/bills']);
  }
}
