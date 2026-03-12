import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService, Expense } from '../expense.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  template: `
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <!-- Header -->
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Business Expenses</h1>
          <p class="text-secondary small mb-0">Track and manage your daily shop operational costs</p>
        </div>
        <div class="col-auto">
          <button class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2" (click)="openAddModal()">
            <span class="fs-5">+</span> Log Expense
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr class="text-muted extra-small fw-bold text-uppercase">
                <th class="py-3 px-4 border-0">DATE</th>
                <th class="py-3 px-4 border-0">CATEGORY</th>
                <th class="py-3 px-4 border-0">NOTES</th>
                <th class="py-3 px-4 border-0 text-end">AMOUNT</th>
                <th class="py-3 px-4 border-0 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exp of expenses" class="border-bottom border-light">
                <td class="py-3 px-4 fw-bold text-dark">{{ exp.date | date:'mediumDate' }}</td>
                <td class="py-3 px-4">
                  <span class="badge bg-light text-secondary border fw-medium rounded-pill px-3">{{ exp.category }}</span>
                </td>
                <td class="py-3 px-4 text-muted small">{{ exp.notes || '---' }}</td>
                <td class="py-3 px-4 text-end fw-extrabold text-danger fs-5">
                  -₹{{ exp.amount | number:'1.2-2' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <button class="btn btn-outline-danger btn-sm rounded-circle p-2" (click)="deleteExpense(exp.id!)" title="Delete">🗑️</button>
                </td>
              </tr>
              <tr *ngIf="expenses.length === 0">
                <td colspan="5" class="py-5 text-center text-muted">
                    <div class="display-1 opacity-25 mb-3">💸</div>
                    <p class="h5 fw-bold text-secondary">No expenses logged yet</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div class="card-footer bg-white border-0 py-4 px-4 border-top border-light">
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small fw-medium">Page <span class="text-dark fw-bold">{{ currentPage }}</span> of <span class="text-dark fw-bold">{{ totalPages || 1 }}</span></span>
                <div class="d-flex gap-2">
                    <button class="btn btn-light btn-sm border rounded-pill px-4 fw-bold" (click)="prevPage()" [disabled]="currentPage === 1">Previous</button>
                    <button class="btn btn-light btn-sm border rounded-pill px-4 fw-bold" (click)="nextPage()" [disabled]="currentPage === totalPages">Next</button>
                </div>
            </div>
        </div>
      </div>

      <!-- Add Expense Modal -->
      <div class="modal fade" [class.show]="isModalOpen" [style.display]="isModalOpen ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-md" role="document">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="modal-header border-0 bg-danger text-white p-4">
                    <h5 class="modal-title fw-bold">Log New Expense</h5>
                    <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
                </div>
                <form (ngSubmit)="saveExpense()">
                    <div class="modal-body p-4 bg-light bg-opacity-50">
                        <div class="row g-4">
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Category</label>
                                <select class="form-select rounded-3 p-3 shadow-none border fw-bold" [(ngModel)]="newExpense.category" name="category" required>
                                    <option value="Electricity">Electricity</option>
                                    <option value="Utility">Utility</option>
                                    <option value="Rent">Rent</option>
                                    <option value="Salary">Staff Salary</option>
                                    <option value="Maintenance">Maintenance & Repairs</option>
                                    <option value="Transport">Transport & Logistics</option>
                                    <option value="Tea/Snacks">Tea / Snacks</option>
                                    <option value="Other">Other Miscellaneous</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Amount (₹)</label>
                                <input type="number" class="form-control rounded-3 p-3 shadow-none border fw-bold" [(ngModel)]="newExpense.amount" name="amount" required placeholder="0.00">
                            </div>
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Date</label>
                                <input type="date" class="form-control rounded-3 p-3 shadow-none border fw-bold" [ngModel]="newExpense.date | date:'yyyy-MM-dd'" (ngModelChange)="newExpense.date = $event" name="date" required>
                            </div>
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Notes (Optional)</label>
                                <textarea class="form-control rounded-3 p-3 shadow-none border" [(ngModel)]="newExpense.notes" name="notes" rows="2" placeholder="Brief description..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4 bg-white d-flex justify-content-end gap-3">
                        <button type="button" class="btn btn-light rounded-pill px-4 fw-bold" (click)="closeModal()">Discard</button>
                        <button type="submit" class="btn btn-danger rounded-pill px-5 fw-bold shadow-sm" [disabled]="isSaving">
                            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isSaving ? 'Saving...' : 'Log Expense' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
      <div class="modal-backdrop fade show" *ngIf="isModalOpen"></div>
    </div>
  `
})
export class ExpenseListComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private notificationService = inject(NotificationService);

  expenses: Expense[] = [];
  isModalOpen = false;
  isSaving = false;

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;

  newExpense: Expense = {
    category: 'Other',
    amount: null as unknown as number,
    date: new Date(),
    shopOwnerId: 0
  };

  ngOnInit() { this.loadExpenses(); }

  loadExpenses() {
    this.expenseService.getExpenses(this.currentPage, this.pageSize).subscribe(data => {
      this.expenses = data.items;
      this.totalCount = data.totalCount;
      this.totalPages = data.totalPages;
    });
  }

  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.loadExpenses(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.loadExpenses(); } }

  openAddModal() {
    this.newExpense = { category: 'Other', amount: null as unknown as number, date: new Date(), shopOwnerId: 0 };
    this.isModalOpen = true;
  }
  closeModal() { this.isModalOpen = false; }

  saveExpense() {
    this.isSaving = true;
    this.expenseService.createExpense(this.newExpense).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadExpenses();
        this.closeModal();
        this.notificationService.success('Expense recorded.');
      },
      error: () => {
        this.isSaving = false;
        this.notificationService.error('Failed to log expense.');
      }
    });
  }

  deleteExpense(id: number) {
    this.notificationService.confirm('Delete this expense record?').then(ok => {
      if (ok) {
        this.expenseService.deleteExpense(id).subscribe(() => {
          this.notificationService.success('Expense deleted.');
          this.loadExpenses();
        });
      }
    });
  }
}
