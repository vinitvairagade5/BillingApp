import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService, Staff } from '../staff.service';
import { NotificationService } from '../notification.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="container-fluid py-4 animate-fade-in shadow-sm bg-white rounded-4 my-2">
      <!-- Header -->
      <div class="row g-4 align-items-center mb-4">
        <div class="col">
          <h1 class="h3 fw-bold mb-1">Staff Management</h1>
          <p class="text-secondary small mb-0">Manage cashier accounts and their system access</p>
        </div>
        <div class="col-auto">
          <button class="btn btn-primary rounded-pill px-4 shadow-sm fw-bold d-flex align-items-center gap-2" (click)="openAddModal()">
            <span class="fs-5">+</span> Add Cashier
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr class="text-muted extra-small fw-bold text-uppercase">
                <th class="py-3 px-4 border-0">USERNAME</th>
                <th class="py-3 px-4 border-0">ROLE</th>
                <th class="py-3 px-4 border-0 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let member of staffList" class="border-bottom border-light">
                <td class="py-3 px-4 fw-bold text-dark fs-6">{{ member.username }}</td>
                <td class="py-3 px-4">
                  <span class="badge bg-light text-primary border fw-medium rounded-pill px-3">{{ member.role }}</span>
                </td>
                <td class="py-3 px-4 text-center">
                  <button class="btn btn-outline-primary btn-sm rounded-circle p-2 me-2" (click)="openEditModal(member)" title="Edit Access">✏️</button>
                  <button class="btn btn-outline-danger btn-sm rounded-circle p-2" (click)="deleteStaff(member.id)" title="Revoke Access">🗑️</button>
                </td>
              </tr>
              <tr *ngIf="staffList.length === 0">
                <td colspan="3" class="py-5 text-center text-muted">
                    <div class="display-1 opacity-25 mb-3">👨‍💼</div>
                    <p class="h5 fw-bold text-secondary">No staff accounts found</p>
                    <p class="small">Add a cashier to allow them to bill customers.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Staff Modal -->
      <div class="modal fade" [class.show]="isModalOpen" [style.display]="isModalOpen ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-sm" role="document">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="modal-header border-0 bg-primary text-white p-4">
                    <h5 class="modal-title fw-bold">Add Cashier</h5>
                    <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
                </div>
                <form (ngSubmit)="saveStaff()">
                    <div class="modal-body p-4 bg-light bg-opacity-50">
                        <div class="row g-4">
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Username</label>
                                <input type="text" class="form-control rounded-3 p-3 shadow-none border fw-bold" [(ngModel)]="newRequest.username" name="username" required placeholder="User Login ID">
                            </div>
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Password</label>
                                <input type="password" class="form-control rounded-3 p-3 shadow-none border fw-bold" [(ngModel)]="newRequest.password" name="password" required placeholder="Secure Password">
                            </div>
                            <div class="col-12 mt-3">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Menu Access</label>
                                <div class="row g-2">
                                  <div class="col-6" *ngFor="let menu of availableMenus">
                                    <div class="form-check form-switch p-2 border rounded-3 bg-white shadow-sm d-flex justify-content-between align-items-center">
                                      <label class="form-check-label small fw-medium text-dark mb-0 ms-1 w-100" [for]="'addCheck' + menu.id">{{ menu.label }}</label>
                                      <input class="form-check-input mt-0 ms-0" style="cursor: pointer" type="checkbox" role="switch" [id]="'addCheck' + menu.id" [checked]="isMenuSelected(menu.id, false)" (change)="toggleMenu(menu.id, false)">
                                    </div>
                                  </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4 bg-white d-flex justify-content-end gap-3">
                        <button type="button" class="btn btn-light rounded-pill px-4 fw-bold" (click)="closeModal()">Discard</button>
                        <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" [disabled]="isSaving">
                            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isSaving ? 'Adding...' : 'Add Cashier' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
      
      <!-- Edit Access Modal -->
      <div class="modal fade" [class.show]="isEditModalOpen" [style.display]="isEditModalOpen ? 'block' : 'none'" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-dialog-centered modal-sm" role="document">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div class="modal-header border-0 bg-primary text-white p-4">
                    <h5 class="modal-title fw-bold">Edit Access: {{ editingStaff?.username }}</h5>
                    <button type="button" class="btn-close btn-close-white" (click)="closeEditModal()"></button>
                </div>
                <form (ngSubmit)="saveEdit()">
                    <div class="modal-body p-4 bg-light bg-opacity-50">
                        <div class="row g-4">
                            <div class="col-12">
                                <label class="form-label extra-small fw-bold text-muted text-uppercase tracking-wider">Menu Access</label>
                                <div class="row g-2">
                                  <div class="col-6" *ngFor="let menu of availableMenus">
                                    <div class="form-check form-switch p-2 border rounded-3 bg-white shadow-sm d-flex justify-content-between align-items-center">
                                      <label class="form-check-label small fw-medium text-dark mb-0 ms-1 w-100" [for]="'editCheck' + menu.id">{{ menu.label }}</label>
                                      <input class="form-check-input mt-0 ms-0" style="cursor: pointer" type="checkbox" role="switch" [id]="'editCheck' + menu.id" [checked]="isMenuSelected(menu.id, true)" (change)="toggleMenu(menu.id, true)">
                                    </div>
                                  </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 p-4 bg-white d-flex justify-content-end gap-3">
                        <button type="button" class="btn btn-light rounded-pill px-4 fw-bold" (click)="closeEditModal()">Discard</button>
                        <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" [disabled]="isSaving">
                            <span *ngIf="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isSaving ? 'Saving...' : 'Save Access' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
      
      <div class="modal-backdrop fade show" *ngIf="isModalOpen || isEditModalOpen"></div>
    </div>
  `
})
export class StaffListComponent implements OnInit {
  private staffService = inject(StaffService);
  private notificationService = inject(NotificationService);

  staffList: Staff[] = [];
  isModalOpen = false;
  isEditModalOpen = false;
  isSaving = false;

  availableMenus = [
    { id: 'bills', label: 'Bills' },
    { id: 'products', label: 'Products' },
    { id: 'customers', label: 'Customers' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'purchases', label: 'Purchases' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'udhaar', label: 'Udhaar' },
    { id: 'reports', label: 'Reports' }
  ];

  newRequest: { username: string, password: string, accessibleMenus: string[] } = { username: '', password: '', accessibleMenus: [] };
  editingStaff: Staff | null = null;
  editRequest: { accessibleMenus: string[] } = { accessibleMenus: [] };

  ngOnInit() { this.loadStaff(); }

  loadStaff() {
    this.staffService.getStaff().subscribe({
      next: (data) => this.staffList = data,
      error: () => this.notificationService.error('Failed to load staff list.')
    });
  }

  openAddModal() {
    this.newRequest = { username: '', password: '', accessibleMenus: [] };
    this.isModalOpen = true;
  }
  closeModal() { this.isModalOpen = false; }

  openEditModal(staff: Staff) {
    this.editingStaff = staff;
    let menus: string[] = [];
    try {
      menus = staff.accessibleMenus ? JSON.parse(staff.accessibleMenus) : [];
    } catch { }
    this.editRequest = { accessibleMenus: menus };
    this.isEditModalOpen = true;
  }
  
  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingStaff = null;
  }

  toggleMenu(menuId: string, isEdit: boolean = false) {
    const list = isEdit ? this.editRequest.accessibleMenus : this.newRequest.accessibleMenus;
    const index = list.indexOf(menuId);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(menuId);
    }
  }

  isMenuSelected(menuId: string, isEdit: boolean = false): boolean {
    const list = isEdit ? this.editRequest.accessibleMenus : this.newRequest.accessibleMenus;
    return list.includes(menuId);
  }

  saveStaff() {
    this.isSaving = true;
    this.staffService.addStaff(this.newRequest).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadStaff();
        this.closeModal();
        this.notificationService.success('Cashier account added successfully.');
      },
      error: (err) => {
        this.isSaving = false;
        // err.error might be a text phrase based on backend responses (BadRequest returning string)
        const msg = typeof err.error === 'string' ? err.error : 'Failed to add cashier.';
        this.notificationService.error(msg);
      }
    });
  }

  saveEdit() {
    if (!this.editingStaff) return;
    this.isSaving = true;
    this.staffService.updateStaffAccess(this.editingStaff.id, this.editRequest.accessibleMenus).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadStaff();
        this.closeEditModal();
        this.notificationService.success('Cashier access updated.');
      },
      error: (err) => {
        this.isSaving = false;
        const msg = typeof err.error === 'string' ? err.error : 'Failed to update access.';
        this.notificationService.error(msg);
      }
    });
  }

  deleteStaff(id: number) {
    this.notificationService.confirm('Are you sure you want to revoke this cashier access?').then(ok => {
      if (ok) {
        this.staffService.deleteStaff(id).subscribe(() => {
          this.notificationService.success('Cashier access revoked.');
          this.loadStaff();
        });
      }
    });
  }
}
