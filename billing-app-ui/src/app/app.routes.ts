import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductListComponent } from './product-list/product-list.component';
import { CustomerListComponent } from './customer-list/customer-list.component';
import { BillListComponent } from './bill-list/bill-list.component';
import { InvoiceCreateComponent } from './invoice-create/invoice-create.component';
import { LoginComponent } from './login/login.component';
import { SettingsComponent } from './settings/settings.component';
import { authGuard } from './auth.guard';

import { BillDetailComponent } from './bill-detail/bill-detail.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: '', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'bills', component: BillListComponent, canActivate: [authGuard] },
    { path: 'bills/:id', component: BillDetailComponent, canActivate: [authGuard] },
    { path: 'products', component: ProductListComponent, canActivate: [authGuard] },
    { path: 'customers', component: CustomerListComponent, canActivate: [authGuard] },
    { path: 'create', component: InvoiceCreateComponent, canActivate: [authGuard] },
    { path: 'settings', component: SettingsComponent, canActivate: [authGuard] }
];
