import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InvoiceService, Customer, Item, CreateBill } from '../invoice.service';
import { CustomerService } from '../customer.service';
import { AuthService } from '../auth.service';
import { PaymentModalComponent } from '../payment-modal/payment-modal.component';
import { NotificationService } from '../notification.service';
import { ProductService } from '../product.service';

@Component({
  selector: 'app-invoice-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PaymentModalComponent],
  template: `
    <div class="container-fluid py-4 animate-fade-in">
      
      <!-- Limit Warning -->
      <div class="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-3 mb-4 p-3 rounded-4" *ngIf="limitReached && !isPro">
         <span class="fs-4">⚠️</span>
         <div class="flex-grow-1">
            <strong class="text-dark">Free Limit Reached (10 Invoices)</strong>
            <p class="mb-0 text-muted small">You have used all your free invoices. Please <a routerLink="/subscription" class="fw-bold text-primary">upgrade to PRO</a> to create more.</p>
         </div>
         <button class="btn btn-primary btn-sm rounded-pill px-3" routerLink="/subscription">Upgrade Now</button>
      </div>

      <!-- Header Row -->
      <div class="row align-items-center mb-4 g-3">
        <div class="col-md">
          <h1 class="h3 mb-1 fw-bold">Create New Invoice</h1>
          <p class="text-muted mb-0 small">Enter details to generate a professional GST invoice</p>
        </div>
        <div class="col-md-auto">
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-light border rounded-pill px-4" routerLink="/">Cancel</button>
            <button 
              type="button" 
              class="btn btn-primary rounded-pill px-4 shadow-sm d-flex align-items-center gap-2" 
              (click)="onSubmit()" 
              [disabled]="invoiceForm.invalid || !selectedCustomer || isSubmitting || (limitReached && !isPro)"
            >
              <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span *ngIf="!isSubmitting">💾</span>
              {{ isSubmitting ? 'Saving...' : 'Save & Generate' }}
            </button>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <!-- Main Form Column -->
        <div class="col-lg-8">
          
          <!-- Step 1: Customer Section -->
          <div class="card border-0 shadow-sm rounded-4 mb-4">
            <div class="card-body p-4">
              <div class="d-flex align-items-center gap-3 mb-4">
                <span class="badge bg-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">1</span>
                <h5 class="mb-0 fw-bold">Customer Details</h5>
              </div>
              
              <div class="position-relative">
                <label class="form-label text-muted small fw-bold text-uppercase">Find Customer</label>
                <div class="input-group shadow-sm rounded-3 overflow-hidden">
                  <span class="input-group-text bg-light border-0 text-muted"><span class="icon">🔍</span></span>
                  <input 
                    type="text" 
                    id="customerSearch" 
                    class="form-control border-0 bg-light py-2" 
                    placeholder="Search by Name or Mobile..."
                    (input)="onCustomerSearch($event)"
                    autocomplete="off"
                  >
                </div>
                
                <!-- Search Results Dropdown -->
                <div class="list-group position-absolute w-100 mt-1 shadow-lg rounded-3 overflow-hidden z-3" *ngIf="customerResults.length > 0 || (customerSearchQuery && customerSearchQuery.length >= 2)">
                  <button class="list-group-item list-group-item-action p-3 border-0 border-bottom" type="button" *ngFor="let c of customerResults" (click)="selectCustomer(c)">
                    <div class="fw-bold">{{ c.name }}</div>
                    <small class="text-muted">{{ c.mobile }}</small>
                  </button>
                  <button class="list-group-item list-group-item-action p-3 bg-light text-primary fw-bold" type="button" *ngIf="customerResults.length === 0 && customerSearchQuery.length >= 2" (click)="openQuickCustomerModal()">
                    <span>➕</span> Add "{{ customerSearchQuery }}" as new customer
                  </button>
                </div>
              </div>

              <!-- Selected Customer Display -->
              <div class="mt-3 p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-10 d-flex align-items-center gap-3" *ngIf="selectedCustomer">
                <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 48px; height: 48px; font-size: 1.2rem;">
                   {{ selectedCustomer.name.charAt(0) }}
                </div>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="fw-bold text-dark text-truncate">{{ selectedCustomer.name }}</div>
                  <div class="small text-primary fw-semibold">{{ selectedCustomer.mobile }}</div>
                  <small class="text-muted d-block text-truncate">{{ selectedCustomer.address }}</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger border-0 fw-bold" (click)="selectedCustomer = null; invoiceForm.patchValue({customerId: null})">Change</button>
              </div>
            </div>
          </div>

          <!-- Step 2: Items Section -->
          <form [formGroup]="invoiceForm">
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-4">
                <div class="d-flex align-items-center gap-3 mb-4">
                  <span class="badge bg-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">2</span>
                  <h5 class="mb-0 fw-bold">Invoice Items</h5>
                </div>
                
                <div class="mb-4" formArrayName="items">
                  <!-- Table Header (Desktop) -->
                  <div class="row g-2 mb-2 d-none d-md-flex px-2 text-muted small fw-bold text-uppercase">
                    <div class="col-md-4">Item Name</div>
                    <div class="col-md-2 text-center">Price</div>
                    <div class="col-md-2 text-center">Qty</div>
                    <div class="col-md-1 text-center">GST</div>
                    <div class="col-md-2 text-end">Total</div>
                    <div class="col-md-1"></div>
                  </div>

                  <!-- Item Rows -->
                  <div *ngFor="let item of items.controls; let i=index" [formGroupName]="i" 
                       class="row g-2 mb-3 mb-md-2 p-3 p-md-0 rounded-3 bg-light bg-md-transparent border border-md-0 shadow-sm shadow-md-none position-relative">
                    
                    <div class="col-md-4 col-12 mb-2 mb-md-0 position-relative">
                       <label class="d-md-none small text-muted fw-bold mb-1">Item Name</label>
                       <input formControlName="itemName" class="form-control border-light py-2 shadow-sm" placeholder="Search item..." (input)="onItemSearch($event, i)" autocomplete="off">
                       
                       <!-- Item Search Dropdown -->
                       <div class="list-group position-absolute w-100 mt-1 shadow-lg rounded-3 overflow-hidden z-3" *ngIf="itemSearchIndex === i && (itemResults.length > 0 || (itemSearchQuery && itemSearchQuery.length >= 2))">
                         <button class="list-group-item list-group-item-action p-2 border-0 border-bottom" type="button" *ngFor="let res of itemResults" (click)="selectItem(res, i)">
                           <div class="fw-bold small">{{ res.name }}</div>
                           <small class="text-muted">₹{{ res.price }} • Stock: {{ res.stockQuantity }}</small>
                         </button>
                         <button class="list-group-item list-group-item-action p-2 bg-light text-primary fw-bold small" type="button" *ngIf="itemResults.length === 0 && itemSearchQuery.length >= 2" (click)="openQuickProductModal()">
                            <span>➕</span> Add "{{ itemSearchQuery }}"
                         </button>
                       </div>
                    </div>
                    
                    <div class="col-md-2 col-6 mb-2 mb-md-0 text-center">
                      <label class="d-md-none small text-muted fw-bold d-block mb-1">Price</label>
                      <input type="number" formControlName="price" class="form-control border-light text-md-center py-2 shadow-sm" (input)="calculateItemTotal(i)">
                    </div>
                    
                    <div class="col-md-2 col-6 mb-2 mb-md-0 text-center">
                      <label class="d-md-none small text-muted fw-bold d-block mb-1">Qty</label>
                      <input type="number" formControlName="quantity" 
                             class="form-control border-light text-md-center py-2 shadow-sm" 
                             [class.is-invalid]="item.get('quantity')?.hasError('insufficientStock')"
                             (input)="calculateItemTotal(i)">
                      <div class="invalid-feedback small position-absolute" style="font-size: 0.7rem;" *ngIf="item.get('quantity')?.hasError('insufficientStock')">
                         Only {{ item.get('stockQuantity')?.value }} left!
                      </div>
                      <small class="text-muted d-none d-md-block mt-1" style="font-size: 0.65rem;" *ngIf="item.get('stockQuantity')?.value !== null">
                        Stock: {{ item.get('stockQuantity')?.value }}
                      </small>
                    </div>
                    
                    <div class="col-md-1 col-4 mb-2 mb-md-0 text-center">
                      <label class="d-md-none small text-muted fw-bold d-block mb-1">GST %</label>
                      <select formControlName="gstRate" class="form-select border-light text-md-center py-2 shadow-sm" (change)="calculateItemTotal(i)">
                        <option *ngFor="let rate of availableGstRates" [value]="rate">{{ rate }}%</option>
                      </select>
                    </div>
                    
                    <div class="col-md-2 col-5 mb-2 mb-md-0 text-md-end d-flex flex-column justify-content-center">
                      <label class="d-md-none small text-muted fw-bold d-block mb-1">Total</label>
                      <span class="fw-bold text-dark">₹{{ item.get('total')?.value | number:'1.2-2' }}</span>
                    </div>
                    
                    <div class="col-md-1 col-3 text-end d-flex align-items-center justify-content-end">
                      <button type="button" class="btn btn-outline-danger border-0 p-2" (click)="removeItem(i)" *ngIf="items.length > 1" title="Remove Item">🗑️</button>
                    </div>
                  </div>
                </div>

                <button type="button" class="btn btn-outline-primary w-100 py-2 border-dashed fw-bold" (click)="addItem()">
                  <span class="me-2">➕</span> Add Another Item
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- Sidebar Summary Column -->
        <div class="col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 sticky-top" style="top: 2rem;">
            <div class="card-body p-4">
              <h5 class="fw-bold mb-4">Invoice Summary</h5>
              
              <div class="list-group list-group-flush mb-4">
                <div class="list-group-item bg-transparent d-flex justify-content-between px-0 py-2 border-0">
                  <span class="text-muted">Subtotal</span>
                  <span class="fw-semibold">₹{{ invoiceForm.get('subTotal')?.value | number:'1.2-2' }}</span>
                </div>
                <div class="list-group-item bg-transparent d-flex justify-content-between px-0 py-2 border-0">
                  <span class="text-muted">CGST</span>
                  <span class="fw-semibold">₹{{ invoiceForm.get('totalCGST')?.value | number:'1.2-2' }}</span>
                </div>
                <div class="list-group-item bg-transparent d-flex justify-content-between px-0 py-2 border-0">
                  <span class="text-muted">SGST</span>
                  <span class="fw-semibold">₹{{ invoiceForm.get('totalSGST')?.value | number:'1.2-2' }}</span>
                </div>
                <div class="list-group-item bg-transparent d-flex justify-content-between px-0 py-3 border-top mt-2">
                  <span class="fw-bold h5 mb-0">Total</span>
                  <span class="fw-bold h4 mb-0 text-success">₹{{ invoiceForm.get('totalAmount')?.value | number:'1.2-2' }}</span>
                </div>
              </div>
              
              <div class="mb-4">
                 <label class="form-label text-muted small fw-bold text-uppercase d-block mb-3">Payment Method</label>
                 <div class="row g-2">
                    <div class="col-4">
                       <div class="pay-method-card" [class.active]="invoiceForm.get('paymentMethod')?.value === 'CASH'" (click)="invoiceForm.patchValue({paymentMethod: 'CASH'})">
                          <div class="fs-4 mb-1">💵</div>
                          <div class="small fw-bold">Cash</div>
                       </div>
                    </div>
                    <div class="col-4">
                       <div class="pay-method-card" [class.active]="invoiceForm.get('paymentMethod')?.value === 'UPI'" (click)="onPaymentMethodSelect('UPI')">
                          <div class="fs-4 mb-1">📱</div>
                          <div class="small fw-bold">UPI</div>
                       </div>
                    </div>
                    <div class="col-4">
                       <div class="pay-method-card" [class.active]="invoiceForm.get('paymentMethod')?.value === 'CREDIT'" (click)="invoiceForm.patchValue({paymentMethod: 'CREDIT'})">
                          <div class="fs-4 mb-1">📝</div>
                          <div class="small fw-bold">Udhaar</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div class="alert alert-danger bg-danger-subtle border-0 p-3 rounded-3 mb-4" *ngIf="(invoiceForm.invalid || !selectedCustomer) && !isSubmitting">
                 <div *ngIf="!selectedCustomer" class="small fw-bold mb-1">⚠️ Select a customer (Step 1)</div>
                 <div *ngIf="items.invalid" class="small fw-bold">⚠️ Fill item details correctly (Step 2)</div>
              </div>

              <button type="button" class="btn btn-success btn-lg w-100 py-3 rounded-3 fw-bold shadow-sm" (click)="onSubmit()" [disabled]="invoiceForm.invalid || !selectedCustomer || isSubmitting || (limitReached && !isPro)">
                <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                 {{ isSubmitting ? 'Processing...' : 'Generate Invoice' }}
              </button>
            </div>
            <div class="card-footer bg-light border-0 p-4 text-center">
                 <p class="small text-muted mb-0"><span class="fs-5 me-2">💡</span> Professional GST Invoice compliant with HSN standards</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals Section -->
    <div *ngIf="showQuickCustomerModal || showQuickProductModal || showSuccessModal" class="modal-backdrop fade show"></div>
    
    <!-- Quick Add Customer Modal -->
    <div class="modal fade" [class.show]="showQuickCustomerModal" [style.display]="showQuickCustomerModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header border-0 bg-light p-4">
            <h5 class="modal-title fw-bold">Quick Add Customer</h5>
            <button type="button" class="btn-close" (click)="closeQuickCustomerModal()"></button>
          </div>
          <div class="modal-body p-4">
            <form [formGroup]="quickCustomerForm">
              <div class="mb-3">
                <label class="form-label fw-bold small text-muted">Full Name</label>
                <input type="text" formControlName="name" class="form-control py-2 bg-light border-0">
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold small text-muted">Mobile Number</label>
                <input type="text" formControlName="mobile" class="form-control py-2 bg-light border-0">
              </div>
              <div class="mb-0">
                <label class="form-label fw-bold small text-muted">Address (Optional)</label>
                <textarea formControlName="address" class="form-control py-2 bg-light border-0" rows="2"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-4" (click)="closeQuickCustomerModal()">Cancel</button>
            <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold" (click)="saveQuickCustomer()" [disabled]="quickCustomerForm.invalid">Save Customer</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Product Modal -->
    <div class="modal fade" [class.show]="showQuickProductModal" [style.display]="showQuickProductModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header border-0 bg-light p-4">
            <h5 class="modal-title fw-bold">Quick Add Product</h5>
            <button type="button" class="btn-close" (click)="closeQuickProductModal()"></button>
          </div>
          <div class="modal-body p-4">
            <form [formGroup]="quickProductForm">
              <div class="mb-3">
                <label class="form-label fw-bold small text-muted">Product Name</label>
                <input type="text" formControlName="name" class="form-control py-2 bg-light border-0">
              </div>
              <div class="row g-3 mb-3">
                  <div class="col-6">
                    <label class="form-label fw-bold small text-muted">Price (₹)</label>
                    <input type="number" formControlName="price" class="form-control py-2 bg-light border-0">
                  </div>
                  <div class="col-6">
                    <label class="form-label fw-bold small text-muted">Stock Qty</label>
                    <input type="number" formControlName="stockQuantity" class="form-control py-2 bg-light border-0">
                  </div>
              </div>
              <div class="row g-3">
                  <div class="col-6">
                    <label class="form-label fw-bold small text-muted">GST %</label>
                    <select formControlName="gstRate" class="form-select py-2 bg-light border-0">
                        <option *ngFor="let rate of availableGstRates" [value]="rate">{{ rate }}%</option>
                    </select>
                  </div>
                  <div class="col-6">
                    <label class="form-label fw-bold small text-muted">HSN Code</label>
                    <input type="text" formControlName="hsnCode" class="form-control py-2 bg-light border-0">
                  </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0 p-4 pt-0">
            <button type="button" class="btn btn-light rounded-pill px-4" (click)="closeQuickProductModal()">Cancel</button>
            <button type="button" class="btn btn-primary rounded-pill px-4 fw-bold" (click)="saveQuickProduct()" [disabled]="quickProductForm.invalid">Save Product</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div class="modal fade" [class.show]="showSuccessModal" [style.display]="showSuccessModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-5 overflow-hidden text-center p-4">
          <div class="modal-body py-5">
            <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4" style="width: 80px; height: 80px;">
              <span class="fs-1">✅</span>
            </div>
            <h2 class="h3 fw-bold mb-2">Invoice Generated!</h2>
            <div class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 px-3 py-2 rounded-pill mb-4 fs-6 fw-bold">Inv #{{ createdBillNumber }}</div>
            <p class="text-muted mb-5">Professional invoice created and ready to share with customer.</p>
            
            <div class="d-grid gap-2 mb-4">
              <button class="btn btn-primary rounded-pill py-3 fw-bold" (click)="shareOnWhatsapp()">📱 Share on WhatsApp</button>
              <button class="btn btn-outline-primary rounded-pill py-3 fw-bold" (click)="viewInvoice()">👁️ View & Print</button>
              <button class="btn btn-light rounded-pill py-3 fw-bold text-muted border" (click)="downloadPdf()">📄 Download PDF</button>
            </div>

            <div class="d-flex justify-content-center gap-3 mt-4">
              <button class="btn btn-link text-decoration-none fw-bold" (click)="resetForm()">Create Another</button>
              <button class="btn btn-link text-decoration-none text-muted fw-bold" (click)="goToBills()">View All Bills</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- UPI Payment Modal -->
    <app-payment-modal
      [isOpen]="isPaymentModalOpen"
      [amount]="invoiceForm.get('totalAmount')?.value || 0"
      [shopUpiId]="shopUpiId"
      [shopName]="shopName"
      (closeEvent)="closePaymentModal()"
      (confirmEvent)="onPaymentConfirmed()"
    ></app-payment-modal>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .border-dashed { border: 2px dashed #dee2e6 !important; }
    .border-dashed:hover { border-color: var(--bs-primary) !important; background-color: var(--bs-primary-bg-subtle); color: var(--bs-primary) !important; }

    .pay-method-card {
       background: #f8fafc;
       border: 1px solid #e9ecef;
       border-radius: 12px;
       padding: 12px 8px;
       text-align: center;
       cursor: pointer;
       transition: all 0.2s;
    }
    .pay-method-card:hover { border-color: #dee2e6; transform: translateY(-2px); }
    .pay-method-card.active {
        background: #e7f1ff;
        border-color: #0d6efd;
        color: #0d6efd;
        box-shadow: 0 4px 6px rgba(13, 110, 253, 0.1);
    }
    
    .z-3 { z-index: 1050; }
    
    @media (max-width: 767px) {
        .btn-link { font-size: 0.85rem; }
    }
  `]
})
export class InvoiceCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private invoiceService = inject(InvoiceService);
  private productService = inject(ProductService);
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  invoiceForm!: FormGroup;
  quickCustomerForm!: FormGroup;
  quickProductForm!: FormGroup;
  selectedCustomer: Customer | null = null;
  customerResults: Customer[] = [];
  customerSearchQuery: string = '';
  itemResults: Item[] = [];
  itemSearchIndex: number | null = null;
  itemSearchQuery: string = '';

  showQuickCustomerModal: boolean = false;
  showQuickProductModal: boolean = false;
  showSuccessModal: boolean = false;
  createdBillId: number | null = null;
  createdBillNumber: string = '';
  isSubmitting: boolean = false;
  limitReached: boolean = false;
  isPro: boolean = false;

  availableGstRates: number[] = [0, 5, 12, 18, 28];

  // Payment Modal State
  isPaymentModalOpen: boolean = false;
  shopUpiId: string = '';
  shopName: string = '';

  ngOnInit() {
    this.initForm();
    this.initQuickCustomerForm();
    this.initQuickProductForm();
    this.addItem();

    // Load dynamic GST rates and check subscription status
    const user = this.authService.currentUserValue;
    if (user) {
      this.isPro = !!(user.subscriptionType === 'PRO' && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date());

      if (user.gstRates) {
        this.availableGstRates = user.gstRates.split(',').map(r => parseFloat(r)).sort((a: number, b: number) => a - b);
      }

      this.shopUpiId = user.upiId || '';
      this.shopName = user.shopName || '';

      if (!this.isPro) {
        this.invoiceService.getDashboardStats().subscribe(stats => {
          if (stats.totalInvoices >= 10) {
            this.limitReached = true;
          }
        });
      }
    }
  }

  initForm() {
    this.invoiceForm = this.fb.group({
      customerId: [null, Validators.required],
      date: [new Date().toISOString()],
      subTotal: [0],
      discount: [0],
      totalCGST: [0],
      totalSGST: [0],
      totalIGST: [0],
      totalAmount: [0],
      paymentMethod: ['CASH'],
      items: this.fb.array([], Validators.required)
    });
  }

  initQuickCustomerForm() {
    this.quickCustomerForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      address: ['']
    });
  }

  initQuickProductForm() {
    this.quickProductForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0.01)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      gstRate: [18],
      hsnCode: ['']
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
      total: [0],
      stockQuantity: [null] // Track stock
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
    this.invoiceService.searchCustomers(query).subscribe(res => {
      this.customerResults = res;
    });
  }

  openQuickCustomerModal() {
    this.showQuickCustomerModal = true;
    const initialName = isNaN(Number(this.customerSearchQuery)) ? this.customerSearchQuery : '';
    const initialMobile = !isNaN(Number(this.customerSearchQuery)) && this.customerSearchQuery.length <= 10 ? this.customerSearchQuery : '';

    this.quickCustomerForm.patchValue({
      name: initialName,
      mobile: initialMobile
    });
  }

  closeQuickCustomerModal() {
    this.showQuickCustomerModal = false;
    this.quickCustomerForm.reset();
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
        this.notificationService.error('Failed to add customer. Mobile number might already exist.');
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
    this.itemSearchQuery = query;
    if (query.length < 2) {
      this.itemResults = [];
      return;
    }
    this.invoiceService.searchItems(query).subscribe(res => {
      this.itemResults = res;
    });
  }

  openQuickProductModal() {
    this.showQuickProductModal = true;
    this.quickProductForm.patchValue({
      name: this.itemSearchQuery,
      price: 0,
      stockQuantity: 10,
      gstRate: 18
    });
  }

  closeQuickProductModal() {
    this.showQuickProductModal = false;
    this.quickProductForm.reset();
  }

  saveQuickProduct() {
    if (this.quickProductForm.invalid) return;

    const shopOwnerId = this.authService.currentUserValue?.id || 0;
    const product = { ...this.quickProductForm.value, shopOwnerId };

    this.productService.createProduct(product).subscribe({
      next: (res) => {
        const newItem: Item = {
          id: res.id,
          ...product
        };

        if (this.itemSearchIndex !== null) {
          this.selectItem(newItem, this.itemSearchIndex);
        }
        this.closeQuickProductModal();
        this.notificationService.success('Product added successfully!');
      },
      error: (err) => {
        console.error('Error creating product', err);
        this.notificationService.error('Failed to create product.');
      }
    });
  }

  selectItem(item: Item, index: number) {
    const itemGroup = this.items.at(index) as FormGroup;
    itemGroup.patchValue({
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      hsnCode: item.hsnCode,
      gstRate: item.gstRate || 18
    });

    // Store available stock in a temporary property on the control for validation in template/TS
    // Since we can't easily add ad-hoc properties to AbstractControl, we might need a separate tracker or just use a custom validator.
    // For simplicity, let's just use the item object reference if needed or add a hidden control.
    // Let's add 'stockQuantity' control to the formGroup
    if (!itemGroup.contains('stockQuantity')) {
      itemGroup.addControl('stockQuantity', this.fb.control(item.stockQuantity));
    } else {
      itemGroup.patchValue({ stockQuantity: item.stockQuantity });
    }

    this.itemResults = [];
    this.itemSearchIndex = null;
    this.calculateItemTotal(index);
  }

  calculateItemTotal(index: number) {
    const itemGroup = this.items.at(index);
    const price = itemGroup.get('price')?.value || 0;
    const quantity = itemGroup.get('quantity')?.value || 0;
    const gstRate = itemGroup.get('gstRate')?.value || 0;
    const stockQuantity = itemGroup.get('stockQuantity')?.value;

    // Stock Validation Warning
    if (stockQuantity !== undefined && quantity > stockQuantity) {
      itemGroup.get('quantity')?.setErrors({ 'insufficientStock': true });
    } else {
      if (itemGroup.get('quantity')?.hasError('insufficientStock')) {
        itemGroup.get('quantity')?.setErrors(null);
        // Re-run other validators if any? Min(1) is standard.
        if (quantity < 1) itemGroup.get('quantity')?.setErrors({ 'min': true });
      }
    }

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
    if (this.invoiceForm.invalid || !this.selectedCustomer || (this.limitReached && !this.isPro)) return;

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
        const errorMsg = err.error?.message || err.error || 'Failed to create invoice. Please check your internet or server connection.';
        this.notificationService.error(errorMsg);
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

  onPaymentMethodSelect(method: string) {
    this.invoiceForm.patchValue({ paymentMethod: method });

    if (method === 'UPI') {
      if (!this.shopUpiId) {
        this.notificationService.warning('Please set up your UPI ID in Settings to use UPI payments.');
        return;
      }
      // Only open if amount > 0
      if (this.invoiceForm.get('totalAmount')?.value > 0) {
        this.isPaymentModalOpen = true;
      } else {
        // Maybe alert? Or just select it.
        console.log('Total amount is 0, just selecting UPI');
      }
    }
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
  }

  onPaymentConfirmed() {
    this.isPaymentModalOpen = false;
    // Payment is confirmed visually. User can now save.
  }
}
