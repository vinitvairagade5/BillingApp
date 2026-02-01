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
    <div class="page-container animation-fade-in">
      <div class="container-xl py-4 py-lg-5">
        
        <!-- Limit Warning -->
        <div class="limit-warning-banner glass d-flex align-items-center gap-3 mb-4 p-3" *ngIf="limitReached && !isPro">
           <span class="fs-4 text-warning">⚠️</span>
           <div class="flex-grow-1">
              <strong class="text-danger-emphasis">Free Limit Reached (10 Invoices)</strong>
              <p class="mb-0 text-danger small">You have used all your free invoices. Please <a routerLink="/subscription" class="fw-bold text-decoration-underline text-danger">upgrade to PRO</a> to create more.</p>
           </div>
           <button class="btn btn-primary sm" routerLink="/subscription">Upgrade Now</button>
        </div>

        <!-- Header -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 bg-white p-4 rounded-4 shadow-sm">
          <div>
            <h1 class="h2 mb-1 fw-bold">Create New Invoice</h1>
            <p class="text-muted mb-0">Enter details to generate a professional GST invoice</p>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-secondary text-dark bg-light border-0" routerLink="/">Cancel</button>
            <button 
              type="button" 
              class="btn btn-success btn-lg shadow-vibrant d-flex align-items-center gap-2" 
              (click)="onSubmit()" 
              [disabled]="invoiceForm.invalid || !selectedCustomer || isSubmitting || (limitReached && !isPro)"
            >
              <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span *ngIf="!isSubmitting">💾</span>
              {{ isSubmitting ? 'Saving...' : 'Save & Generate' }}
            </button>
          </div>
        </div>

        <div class="row g-4">
          <!-- Main Form Column -->
          <div class="col-lg-8">
            
            <!-- Customer Section -->
            <div class="glass card p-4 mb-4 border-0" style="position: relative; z-index: 20;">
              <div class="d-flex align-items-center gap-3 mb-4 w-100">
                <span class="step-num">1</span>
                <h3 class="h5 fw-bold mb-0">Customer Details</h3>
              </div>
              
              <div class="position-relative">
                <label class="form-label fw-bold text-muted small">Find Customer</label>
                <div class="search-input-container">
                  <span class="search-icon">🔍</span>
                  <input 
                    type="text" 
                    id="customerSearch" 
                    class="form-control premium-input ps-5" 
                    placeholder="Search by Name or Mobile..."
                    (input)="onCustomerSearch($event)"
                    autocomplete="off"
                  >
                </div>
                
                <!-- Search Results Dropdown -->
                <div class="dropdown-menu show w-100 mt-2 border-0 shadow-premium rounded-4 overflow-hidden" *ngIf="customerResults.length > 0 || (customerSearchQuery && customerSearchQuery.length >= 2)" style="position: absolute; z-index: 1050;">
                  <button class="dropdown-item p-3 border-bottom" type="button" *ngFor="let c of customerResults" (click)="selectCustomer(c)">
                    <div class="fw-bold">{{ c.name }}</div>
                    <small class="text-muted">{{ c.mobile }}</small>
                  </button>
                  <button class="dropdown-item p-3 bg-light text-primary fw-bold d-flex align-items-center gap-2" type="button" *ngIf="customerResults.length === 0 && customerSearchQuery.length >= 2" (click)="openQuickCustomerModal()">
                    <span>➕</span> Add "{{ customerSearchQuery }}" as new customer
                  </button>
                </div>
              </div>

              <div class="selected-customer-card mt-3 d-flex align-items-center gap-3 p-3 rounded-4 bg-primary-subtle" *ngIf="selectedCustomer">
                <div class="cust-avatar bg-primary text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px; font-weight: 700; font-size: 1.25rem;">
                   {{ selectedCustomer.name.charAt(0) }}
                </div>
                <div class="flex-grow-1 overflow-hidden">
                  <h5 class="mb-0 fw-bold text-primary-emphasis text-truncate">{{ selectedCustomer.name }}</h5>
                  <p class="mb-0 text-primary small fw-semibold">{{ selectedCustomer.mobile }}</p>
                  <small class="text-muted d-block text-truncate">{{ selectedCustomer.address }}</small>
                </div>
                <button type="button" class="btn btn-link text-danger fw-bold text-decoration-none p-0" (click)="selectedCustomer = null; invoiceForm.patchValue({customerId: null})">Change</button>
              </div>
            </div>

            <!-- Items Section -->
            <form [formGroup]="invoiceForm">
              <div class="glass card p-4 border-0">
                <div class="d-flex align-items-center gap-3 mb-4">
                  <span class="step-num">2</span>
                  <h3 class="h5 fw-bold mb-0">Invoice Items</h3>
                </div>
                
                <div class="mb-3" formArrayName="items">
                  <div class="item-row-header d-none d-md-grid px-2 mb-2">
                    <span class="text-uppercase text-muted fw-bold small" style="grid-column: 1;">Item Name</span>
                    <span class="text-uppercase text-muted fw-bold small text-center" style="grid-column: 2;">Price</span>
                    <span class="text-uppercase text-muted fw-bold small text-center" style="grid-column: 3;">Qty</span>
                    <span class="text-uppercase text-muted fw-bold small text-center" style="grid-column: 4;">GST</span>
                    <span class="text-uppercase text-muted fw-bold small text-end" style="grid-column: 5;">Total</span>
                    <span style="grid-column: 6;"></span>
                  </div>

                  <div *ngFor="let item of items.controls; let i=index" [formGroupName]="i" class="item-grid-row mb-3 mb-md-2 p-3 p-md-0 rounded-3 bg-white bg-md-transparent border border-md-0 shadow-sm shadow-md-none">
                    <div class="grid-col-name position-relative mb-2 mb-md-0">
                       <label class="d-md-none small text-muted fw-bold mb-1">Item Name</label>
                       <input 
                         formControlName="itemName" 
                         class="form-control premium-input" 
                         placeholder="Search item..."
                         (input)="onItemSearch($event, i)"
                         autocomplete="off"
                       >
                       <div class="dropdown-menu show w-100 mt-1 border-0 shadow-premium rounded-4 overflow-hidden" *ngIf="itemSearchIndex === i && (itemResults.length > 0 || (itemSearchQuery && itemSearchQuery.length >= 2))" style="position: absolute; z-index: 1050;">
                         <button class="dropdown-item p-2 border-bottom" type="button" *ngFor="let res of itemResults" (click)="selectItem(res, i)">
                           <div class="fw-bold">{{ res.name }}</div>
                           <small class="text-muted">₹{{ res.price }} • Stock: {{ res.stockQuantity }}</small>
                         </button>
                         <button class="dropdown-item p-3 bg-light text-primary fw-bold d-flex align-items-center gap-2" type="button" *ngIf="itemResults.length === 0 && itemSearchQuery.length >= 2" (click)="openQuickProductModal()">
                            <span>➕</span> Add "{{ itemSearchQuery }}" as new product
                         </button>
                       </div>
                    </div>
                    
                    <div class="grid-col-price mb-2 mb-md-0">
                      <label class="d-md-none small text-muted fw-bold mb-1">Price</label>
                      <input type="number" formControlName="price" class="form-control premium-input text-md-center" (input)="calculateItemTotal(i)">
                    </div>
                    
                    <div class="grid-col-qty mb-2 mb-md-0 position-relative">
                      <label class="d-md-none small text-muted fw-bold mb-1">Qty</label>
                      <input type="number" formControlName="quantity" class="form-control premium-input text-md-center" (input)="calculateItemTotal(i)"
                             [class.is-invalid]="item.get('quantity')?.hasError('insufficientStock')">
                      <div class="invalid-feedback position-absolute text-nowrap" style="top: 100%; left: 0; font-size: 0.7rem;" *ngIf="item.get('quantity')?.hasError('insufficientStock')">
                         Only {{ item.get('stockQuantity')?.value }} left!
                      </div>
                      <small *ngIf="item.get('stockQuantity')?.value !== null && !item.get('quantity')?.hasError('insufficientStock')" class="text-muted d-block text-center" style="font-size: 0.7rem;">
                        Stock: {{ item.get('stockQuantity')?.value }}
                      </small>
                    </div>
                    
                    <div class="grid-col-gst mb-2 mb-md-0">
                      <label class="d-md-none small text-muted fw-bold mb-1">GST %</label>
                      <select formControlName="gstRate" class="form-control premium-input text-md-center" (change)="calculateItemTotal(i)">
                        <option *ngFor="let rate of availableGstRates" [value]="rate">{{ rate }}%</option>
                      </select>
                    </div>
                    
                    <div class="grid-col-total d-flex d-md-block justify-content-between align-items-center mb-2 mb-md-0 text-md-end">
                      <label class="d-md-none small text-muted fw-bold mb-0">Total</label>
                      <span class="fw-bold fs-6">₹{{ item.get('total')?.value | number:'1.2-2' }}</span>
                    </div>
                    
                    <div class="grid-col-action text-end">
                      <button type="button" class="btn-icon-delete" (click)="removeItem(i)" *ngIf="items.length > 1" title="Remove Item">🗑️</button>
                    </div>
                  </div>
                </div>

                <button type="button" class="btn btn-outline-dashed w-100 py-3 fw-bold text-muted" (click)="addItem()">
                  <span class="me-2">➕</span> Add Another Item
                </button>
              </div>
            </form>
          </div>

          <!-- Sidebar Summary Column -->
          <div class="col-lg-4">
            <div class="glass card p-4 border-0 sticky-top" style="top: 20px; z-index: 90;">
              <h3 class="h5 fw-bold mb-4">Invoice Summary</h3>
              
              <div class="summary-details">
                <div class="d-flex justify-content-between mb-2 text-muted fw-medium">
                  <span>Subtotal</span>
                  <span>₹{{ invoiceForm.get('subTotal')?.value | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 text-muted fw-medium">
                  <span>CGST</span>
                  <span>₹{{ invoiceForm.get('totalCGST')?.value | number:'1.2-2' }}</span>
                </div>
                <div class="d-flex justify-content-between mb-2 text-muted fw-medium">
                  <span>SGST</span>
                  <span>₹{{ invoiceForm.get('totalSGST')?.value | number:'1.2-2' }}</span>
                </div>
                
                <hr class="my-4 opacity-50">
                
                <div class="d-flex justify-content-between mb-4 align-items-end">
                  <span class="fw-bold text-dark">Total Amount</span>
                  <span class="h3 fw-bold text-success mb-0">₹{{ invoiceForm.get('totalAmount')?.value | number:'1.2-2' }}</span>
                </div>
                
                <div class="mb-4">
                   <label class="form-label text-uppercase text-muted fw-bold small mb-3">Payment Method</label>
                   <div class="d-grid gap-2 d-md-flex justify-content-between">
                      <div class="pay-option flex-grow-1" [class.active]="invoiceForm.get('paymentMethod')?.value === 'CASH'" (click)="invoiceForm.patchValue({paymentMethod: 'CASH'})">
                         <span class="fs-4 d-block mb-1">💵</span>
                         <span class="small fw-bold text-muted text-uppercase">Cash</span>
                      </div>
                      <div class="pay-option flex-grow-1" [class.active]="invoiceForm.get('paymentMethod')?.value === 'UPI'" (click)="onPaymentMethodSelect('UPI')">
                         <span class="fs-4 d-block mb-1">📱</span>
                         <span class="small fw-bold text-muted text-uppercase">UPI</span>
                      </div>
                      <div class="pay-option flex-grow-1" [class.active]="invoiceForm.get('paymentMethod')?.value === 'CREDIT'" (click)="invoiceForm.patchValue({paymentMethod: 'CREDIT'})">
                         <span class="fs-4 d-block mb-1">📝</span>
                         <span class="small fw-bold text-muted text-uppercase">Udhaar</span>
                      </div>
                   </div>
                </div>

                <div class="alert alert-danger border-0 bg-danger-subtle text-danger p-3 rounded-4 mb-3" *ngIf="(invoiceForm.invalid || !selectedCustomer) && !isSubmitting">
                   <div *ngIf="!selectedCustomer" class="d-flex align-items-center gap-2 mb-1"><span class="small">⚠️</span> <small class="fw-bold">Select a customer (Step 1)</small></div>
                   <div *ngIf="items.invalid" class="d-flex align-items-center gap-2"><span class="small">⚠️</span> <small class="fw-bold">Fill item details (Step 2)</small></div>
                </div>

                <button type="button" class="btn btn-success w-100 py-3 fw-bold shadow-vibrant text-uppercase tracking-wide" (click)="onSubmit()" [disabled]="invoiceForm.invalid || !selectedCustomer || isSubmitting || (limitReached && !isPro)">
                  <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                   {{ isSubmitting ? 'Processing...' : 'Save & Generate Invoice' }}
                </button>
              </div>
            </div>
            
            <div class="mt-4 p-4 rounded-4 glass border-0 d-flex gap-3 align-items-start">
                 <span class="fs-3">💡</span>
                 <p class="small text-muted mb-0 lh-base fw-medium">Invoices are generated using the Indian GST format complying with HSN standards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Add Customer Modal -->
    <div class="modal fade" [class.show]="showQuickCustomerModal" [style.display]="showQuickCustomerModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-premium rounded-4 p-2">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">Quick Add Customer</h5>
            <button type="button" class="btn-close" (click)="closeQuickCustomerModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="quickCustomerForm" (ngSubmit)="saveQuickCustomer()">
              <div class="mb-3">
                <label class="form-label fw-bold text-muted small">Full Name</label>
                <input type="text" formControlName="name" class="form-control premium-input" placeholder="e.g. Rahul Kumar">
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold text-muted small">Mobile Number</label>
                <input type="text" formControlName="mobile" class="form-control premium-input" placeholder="10-digit number">
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold text-muted small">Address (Optional)</label>
                <textarea formControlName="address" class="form-control premium-input" rows="2" placeholder="Full Address"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light text-muted fw-bold" (click)="closeQuickCustomerModal()">Cancel</button>
            <button type="button" class="btn btn-primary fw-bold px-4" (click)="saveQuickCustomer()" [disabled]="quickCustomerForm.invalid">Save Customer</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showQuickCustomerModal"></div>

    <!-- Quick Add Product Modal -->
    <div class="modal fade" [class.show]="showQuickProductModal" [style.display]="showQuickProductModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-premium rounded-4 p-2">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold">Quick Add Product</h5>
            <button type="button" class="btn-close" (click)="closeQuickProductModal()"></button>
          </div>
          <div class="modal-body">
            <form [formGroup]="quickProductForm" (ngSubmit)="saveQuickProduct()">
              <div class="mb-3">
                <label class="form-label fw-bold text-muted small">Product Name</label>
                <input type="text" formControlName="name" class="form-control premium-input">
              </div>
              <div class="row">
                  <div class="col-6 mb-3">
                    <label class="form-label fw-bold text-muted small">Price (₹)</label>
                    <input type="number" formControlName="price" class="form-control premium-input">
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label fw-bold text-muted small">Stock Qty</label>
                    <input type="number" formControlName="stockQuantity" class="form-control premium-input">
                  </div>
              </div>
              <div class="row">
                  <div class="col-6 mb-3">
                    <label class="form-label fw-bold text-muted small">GST %</label>
                    <select formControlName="gstRate" class="form-control premium-input">
                        <option *ngFor="let rate of availableGstRates" [value]="rate">{{ rate }}%</option>
                    </select>
                  </div>
                  <div class="col-6 mb-3">
                    <label class="form-label fw-bold text-muted small">HSN Code</label>
                    <input type="text" formControlName="hsnCode" class="form-control premium-input">
                  </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-0">
            <button type="button" class="btn btn-light text-muted fw-bold" (click)="closeQuickProductModal()">Cancel</button>
            <button type="button" class="btn btn-primary fw-bold px-4" (click)="saveQuickProduct()" [disabled]="quickProductForm.invalid">Save Product</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showQuickProductModal"></div>

    <!-- Success & Share Modal -->
    <div class="modal fade" [class.show]="showSuccessModal" [style.display]="showSuccessModal ? 'block' : 'none'" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-premium rounded-5 text-center p-4">
          <div class="modal-body">
            <div class="success-icon-wrapper mb-4 mx-auto">
              <span class="fs-1">✅</span>
            </div>
            <h2 class="h3 fw-bold mb-2">Invoice Created!</h2>
            <div class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill mb-4 fs-6 fw-bold">{{ createdBillNumber }}</div>
            <p class="text-muted mb-5">Your invoice has been generated successfully and is ready to share.</p>
            
            <div class="d-grid gap-3 mb-4 mx-auto" style="max-width: 300px;">
              <button class="btn btn-primary-soft btn-lg fw-bold d-flex align-items-center justify-content-center gap-2" (click)="viewInvoice()">
                <span>👁️</span> View Invoice
              </button>
              <button class="btn btn-whatsapp btn-lg fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm" (click)="shareOnWhatsapp()">
                <span>📱</span> Share on WhatsApp
              </button>
              <button class="btn btn-light btn-lg fw-bold d-flex align-items-center justify-content-center gap-2 text-muted border" (click)="downloadPdf()">
                <span>📄</span> Download PDF
              </button>
            </div>

            <div class="position-relative mb-4">
              <hr class="text-muted opacity-25">
              <span class="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted small fw-bold text-uppercase">or</span>
            </div>

            <div class="d-flex justify-content-center gap-3">
              <button class="btn btn-link text-decoration-none fw-bold" (click)="resetForm()">Create Another</button>
              <button class="btn btn-link text-decoration-none text-muted fw-bold" (click)="goToBills()">Go to Bills</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showSuccessModal"></div>

    <!-- Payment Modal -->
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
    /* Core Aesthetics Restoration */
    .premium-input {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 14px;
        transition: all 0.2s;
        width: 100%;
    }
    .premium-input:focus {
        border-color: var(--primary);
        background: white;
        box-shadow: 0 0 0 4px var(--primary-glow);
        outline: none;
    }

    .shadow-vibrant { box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); }
    .shadow-premium { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }

    .step-num {
        width: 32px;
        height: 32px;
        background: var(--primary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 14px;
        box-shadow: 0 4px 10px var(--primary-glow);
    }
    
    .search-input-container { position: relative; }
    .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    
    .pay-option {
         background: #f8fafc;
         border: 1px solid #e2e8f0;
         border-radius: 12px;
         padding: 16px;
         text-align: center;
         cursor: pointer;
         transition: all 0.2s;
    }
    .pay-option:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .pay-option.active {
        background: #eff6ff;
        border-color: var(--primary);
        box-shadow: 0 0 0 4px var(--primary-glow);
        color: var(--primary);
    }

    .btn-outline-dashed {
        border: 2px dashed #cbd5e1;
        background: #f8fafc;
    }
    .btn-outline-dashed:hover {
        border-color: var(--primary);
        color: var(--primary) !important;
        background: #f0f9ff;
    }

    .btn-icon-delete {
        background: #fee2e2;
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
    }
    .btn-icon-delete:hover {
        background: #ef4444;
        color: white;
        transform: scale(1.1);
    }

    /* Modal Tweaks */
    .success-icon-wrapper {
        width: 80px;
        height: 80px;
        background: #ecfdf5;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid #d1fae5;
        color: #10b981;
    }
    .btn-primary-soft { background: #eff6ff; color: #1e40af; border: none; }
    .btn-primary-soft:hover { background: #dbeafe; color: #1e3a8a; }
    .btn-whatsapp { background: #25d366; color: white; border: none; }
    .btn-whatsapp:hover { background: #128c7e; transform: translateY(-2px); }

    /* Responsive Grid for Items */
    .item-row-header { display: grid; grid-template-columns: 2fr 100px 80px 100px 120px 40px; gap: 12px; }
    
    @media (min-width: 768px) {
        .item-grid-row { display: grid; grid-template-columns: 2fr 100px 80px 100px 120px 40px; gap: 12px; align-items: center; }
    }
    
    /* Animation util */
    .animation-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Number inputs */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
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
