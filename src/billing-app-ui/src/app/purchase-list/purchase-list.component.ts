import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService, Purchase, PurchaseItem } from '../purchase.service';
import { SupplierService, Supplier } from '../supplier.service';
import { ProductService, Item } from '../product.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  template: `
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <!-- Header -->
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Purchases & Stock Inward</h1>
          <p class="text-secondary small mb-0">Record supplier purchases and add products to your stock seamlessly</p>
        </div>
        <div class="col-auto">
          <button class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2" (click)="openAddModal()">
            <span class="fs-5">+</span> Log Purchase
          </button>
        </div>
      </div>

      <!-- Main Table -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr class="text-muted extra-small fw-bold text-uppercase">
                <th class="py-3 px-4 border-0">DATE</th>
                <th class="py-3 px-4 border-0">SUPPLIER</th>
                <th class="py-3 px-4 border-0 text-center">ITEMS INWARDED</th>
                <th class="py-3 px-4 border-0 text-end">PAID</th>
                <th class="py-3 px-4 border-0 text-end">TOTAL BILL</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pur of purchases" class="border-bottom border-light">
                <td class="py-3 px-4 fw-bold text-dark">{{ pur.date | date:'mediumDate' }}</td>
                <td class="py-3 px-4">
                  <div class="fw-bold text-primary">{{ pur.supplierName || 'Supplier #' + pur.supplierId }}</div>
                </td>
                <td class="py-3 px-4 text-center fw-medium text-secondary">
                  <span class="badge bg-light text-dark border">{{ pur.items?.length || 1 }} Items</span>
                </td>
                <td class="py-3 px-4 text-end fw-bold text-success">
                  ₹{{ pur.paidAmount | number:'1.2-2' }}
                </td>
                <td class="py-3 px-4 text-end fw-extrabold text-dark fs-6">
                  ₹{{ pur.totalAmount | number:'1.2-2' }}
                </td>
              </tr>
              <tr *ngIf="purchases.length === 0">
                <td colspan="5" class="py-5 text-center text-muted">
                    <div class="display-1 opacity-25 mb-3">📦</div>
                    <p class="h5 fw-bold text-secondary">No stock purchases recorded</p>
                    <p class="small">Logging purchases will automatically update your product stock logic.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Purchase Modal -->
      <div class="modal fade" [class.show]="isModalOpen" [style.display]="isModalOpen ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="modal-header border-0 bg-dark text-white p-4">
                    <h5 class="modal-title fw-bold">Log Supplier Purchase</h5>
                    <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
                </div>
                <!-- Dynamic Form Body -->
                <div class="modal-body p-4 bg-light bg-opacity-50" style="max-height: 70vh; overflow-y: auto;">
                    <div class="row g-4 mb-4">
                        <div class="col-md-6">
                            <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Select Supplier</label>
                            <select class="form-select rounded-3 p-3 shadow-none border fw-bold" [(ngModel)]="newPurchase.supplierId">
                                <option [ngValue]="0" disabled>-- Choose Supplier --</option>
                                <option *ngFor="let sup of suppliers" [ngValue]="sup.id">{{ sup.name }}</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Purchase Date</label>
                            <input type="date" class="form-control rounded-3 p-3 shadow-none border fw-bold" [ngModel]="newPurchase.date | date:'yyyy-MM-dd'" (ngModelChange)="newPurchase.date = $event">
                        </div>
                    </div>

                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">Products Received</h6>
                    <div class="table-responsive bg-white rounded-3 border mb-3">
                        <table class="table table-sm align-middle mb-0">
                            <thead class="bg-light">
                                <tr class="extra-small fw-bold text-muted">
                                    <th class="ps-3 py-2 border-0">PRODUCT</th>
                                    <th class="py-2 border-0" style="width: 120px;">PRICE (₹)</th>
                                    <th class="py-2 border-0" style="width: 100px;">QTY</th>
                                    <th class="text-end py-2 border-0" style="width: 120px;">TOTAL</th>
                                    <th class="border-0"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let row of newPurchase.items; let i = index">
                                    <td class="ps-3 py-2">
                                        <select class="form-select form-select-sm shadow-none" [(ngModel)]="row.itemId" (change)="onProductSelect(row)">
                                            <option [ngValue]="0" disabled>-- Select --</option>
                                            <option *ngFor="let p of allProducts" [ngValue]="p.id">{{ p.name }}</option>
                                        </select>
                                    </td>
                                    <td class="py-2">
                                        <input type="number" class="form-control form-control-sm text-end shadow-none" [(ngModel)]="row.purchasePrice" (input)="recalculateTotal()">
                                    </td>
                                    <td class="py-2">
                                        <input type="number" class="form-control form-control-sm text-end shadow-none" [(ngModel)]="row.quantity" (input)="recalculateTotal()">
                                    </td>
                                    <td class="text-end py-2 fw-bold text-dark">
                                        ₹{{ (row.purchasePrice * row.quantity) | number:'1.2-2' }}
                                    </td>
                                    <td class="text-center py-2">
                                        <button class="btn btn-sm text-danger p-0" (click)="removeRow(i)">✖</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold mb-4" (click)="addRow()">+ Add Product</button>

                    <h6 class="fw-bold text-dark border-bottom pb-2 mb-3">Payment Summary</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Total Invoice Amount (₹)</label>
                            <input type="number" class="form-control rounded-3 p-3 shadow-none border fw-bold text-dark fs-5 bg-white" readonly [value]="newPurchase.totalAmount">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Amount Paid to Supplier (₹)</label>
                            <input type="number" class="form-control rounded-3 p-3 shadow-none border fw-bold text-success fs-5" [(ngModel)]="newPurchase.paidAmount">
                        </div>
                    </div>

                </div>
                <div class="modal-footer border-0 p-4 bg-white d-flex justify-content-end gap-3">
                    <button type="button" class="btn btn-light rounded-pill px-4 fw-bold" (click)="closeModal()">Discard</button>
                    <button type="button" class="btn btn-dark rounded-pill px-5 fw-bold shadow-sm" (click)="savePurchase()" [disabled]="isSaving || !newPurchase.supplierId || newPurchase.items.length === 0">
                        <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                        {{ isSaving ? 'Committing...' : 'Commit Purchase to Stock' }}
                    </button>
                </div>
            </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="isModalOpen"></div>
    </div>
  `
})
export class PurchaseListComponent implements OnInit {
  private purchaseService = inject(PurchaseService);
  private supplierService = inject(SupplierService);
  private productService = inject(ProductService);
  private notificationService = inject(NotificationService);

  purchases: Purchase[] = [];
  suppliers: Supplier[] = [];
  allProducts: Item[] = [];

  isModalOpen = false;
  isSaving = false;

  newPurchase: Purchase = this.getEmptyPurchase();

  ngOnInit() {
    this.loadPurchases();
    this.loadDependencies();
  }

  loadPurchases() {
    this.purchaseService.getPurchases(1, 100).subscribe((data: any) => {
      this.purchases = data.items || [];
    });
  }

  loadDependencies() {
    this.supplierService.getSuppliers(1, 1000).subscribe((data: any) => this.suppliers = data.items || []);
    this.productService.getProducts(1, 1000).subscribe((data: any) => this.allProducts = data.items || []);
  }

  getEmptyPurchase(): Purchase {
    return { supplierId: 0, date: new Date(), paidAmount: 0, totalAmount: 0, items: [] };
  }

  openAddModal() {
    this.newPurchase = this.getEmptyPurchase();
    this.addRow();
    this.isModalOpen = true;
  }

  closeModal() { this.isModalOpen = false; }

  addRow() {
    this.newPurchase.items.push({ itemId: 0, purchasePrice: 0, quantity: 1 });
  }

  removeRow(index: number) {
    this.newPurchase.items.splice(index, 1);
    this.recalculateTotal();
  }

  onProductSelect(row: PurchaseItem) {
    const prod = this.allProducts.find(p => p.id === row.itemId);
    if (prod) {
      row.purchasePrice = prod.purchasePrice || 0;
    }
    this.recalculateTotal();
  }

  recalculateTotal() {
    this.newPurchase.totalAmount = this.newPurchase.items.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
  }

  savePurchase() {
    // Basic validation
    if (this.newPurchase.items.some(i => !i.itemId || i.quantity <= 0)) {
      this.notificationService.error('Please ensure all selected items have a valid quantity.');
      return;
    }

    this.isSaving = true;
    this.purchaseService.createPurchase(this.newPurchase).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadPurchases();
        this.closeModal();
        this.notificationService.success('Purchase logged. Stock levels updated.');
      },
      error: () => {
        this.isSaving = false;
        this.notificationService.error('Error committing purchase.');
      }
    });
  }
}
