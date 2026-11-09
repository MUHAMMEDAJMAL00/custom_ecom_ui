import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuestGuard } from './core/guards/guest.guard';
import { PlatformAuthGuard } from './core/guards/platform-auth.guard';
import { PlatformOwnerGuard } from './core/guards/platform-owner.guard';
import { TenantAuthGuard } from './core/guards/tenant-auth.guard';
import { TenantGuestGuard } from './core/guards/tenant-guest.guard';
import { TenantModuleGuard } from './core/guards/tenant-module.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuditLogComponent } from './features/platform-admin/audit-log/audit-log.component';
import { ModuleCatalogueComponent } from './features/platform-admin/module-catalogue/module-catalogue.component';
import { PlatformRolesComponent } from './features/platform-admin/platform-roles/platform-roles.component';
import { PlatformUsersComponent } from './features/platform-admin/platform-users/platform-users.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { TenantDashboardComponent } from './features/tenant-dashboard/tenant-dashboard.component';
import { TenantLoginComponent } from './features/tenant-auth/tenant-login/tenant-login.component';
import { TenantModulePageComponent } from './features/tenant-module-page/tenant-module-page.component';
import { TenantCreateComponent } from './features/tenants/tenant-create/tenant-create.component';
import { TenantDomainsComponent } from './features/tenants/tenant-domains/tenant-domains.component';
import { TenantEditComponent } from './features/tenants/tenant-edit/tenant-edit.component';
import { TenantListComponent } from './features/tenants/tenant-list/tenant-list.component';
import { TenantModulesComponent } from './features/tenants/tenant-modules/tenant-modules.component';
import { ShellComponent } from './layout/shell/shell.component';
import { TenantShellComponent } from './layout/tenant-shell/tenant-shell.component';
import { flattenTenantNav } from './layout/tenant-nav-config';
import { environment } from '../environments/environment';

// MySkin admin screens (app/shop/features), lazy-loaded under /t/:slug. The guard checks
// the screen's module and permission from tenant-nav-config.ts.
const SHOP_SCREENS: Routes = [
  { path: 'dashboard', loadChildren: () => import('./shop/features/dashboard/dashboard.module').then((m) => m.DashboardModule) },
  { path: 'customers/newsletter', loadChildren: () => import('./shop/features/newsletter/newsletter.module').then((m) => m.NewsletterModule) },
  { path: 'customers', loadChildren: () => import('./shop/features/customers/customers.module').then((m) => m.CustomersModule) },
  { path: 'products', loadChildren: () => import('./shop/features/products/products.module').then((m) => m.ProductsModule) },
  { path: 'brands', loadChildren: () => import('./shop/features/brands/brands.module').then((m) => m.BrandsModule) },
  { path: 'sellers', loadChildren: () => import('./shop/features/sellers/sellers.module').then((m) => m.SellersModule) },
  { path: 'categories', loadChildren: () => import('./shop/features/categories/categories.module').then((m) => m.CategoriesModule) },
  { path: 'units', loadChildren: () => import('./shop/features/units/units.module').then((m) => m.UnitsModule) },
  { path: 'taxes', loadChildren: () => import('./shop/features/taxes/taxes.module').then((m) => m.TaxesModule) },
  { path: 'vendors', loadChildren: () => import('./shop/features/vendors/vendors.module').then((m) => m.VendorsModule) },
  { path: 'employees', loadChildren: () => import('./shop/features/employees/employees.module').then((m) => m.EmployeesModule) },
  { path: 'users', loadChildren: () => import('./shop/features/users/users.module').then((m) => m.UsersModule) },
  { path: 'expenses', loadChildren: () => import('./shop/features/expenses/expenses.module').then((m) => m.ExpensesModule) },
  { path: 'inventory/batch-tracking', loadChildren: () => import('./shop/features/batch-tracking/batch-tracking.module').then((m) => m.BatchTrackingModule) },
  { path: 'inventory/wastage-returns', loadChildren: () => import('./shop/features/wastage-returns/wastage-returns.module').then((m) => m.WastageReturnsModule) },
  { path: 'inventory', loadChildren: () => import('./shop/features/inventory/inventory.module').then((m) => m.InventoryModule) },
  { path: 'purchases/returns', loadChildren: () => import('./shop/features/purchase-returns/purchase-returns.module').then((m) => m.PurchaseReturnsModule) },
  { path: 'purchases', loadChildren: () => import('./shop/features/purchases/purchases.module').then((m) => m.PurchasesModule) },
  { path: 'payment-sources', loadChildren: () => import('./shop/features/payment-sources/payment-sources.module').then((m) => m.PaymentSourcesModule) },
  { path: 'discounts', loadChildren: () => import('./shop/features/discounts/discounts.module').then((m) => m.DiscountsModule) },
  { path: 'cash', loadChildren: () => import('./shop/features/cash/cash.module').then((m) => m.CashModule) },
  { path: 'customer-payments', loadChildren: () => import('./shop/features/customer-payments/customer-payments.module').then((m) => m.CustomerPaymentsModule) },
  { path: 'supplier-payments', loadChildren: () => import('./shop/features/supplier-payments/supplier-payments.module').then((m) => m.SupplierPaymentsModule) },
  { path: 'salary', loadChildren: () => import('./shop/features/salary/salary.module').then((m) => m.SalaryModule) },
  { path: 'payroll', loadChildren: () => import('./shop/features/payroll/payroll.module').then((m) => m.PayrollModule) },
  { path: 'accounting/chart-of-accounts', loadChildren: () => import('./shop/features/chart-of-accounts/chart-of-accounts.module').then((m) => m.ChartOfAccountsModule) },
  { path: 'accounting/journal-entries', loadChildren: () => import('./shop/features/journal-entries/journal-entries.module').then((m) => m.JournalEntriesModule) },
  { path: 'accounting/assets', loadChildren: () => import('./shop/features/assets-register/assets-register.module').then((m) => m.AssetsRegisterModule) },
  { path: 'accounting/ledger-statement', loadChildren: () => import('./shop/features/ledger-statement/ledger-statement.module').then((m) => m.LedgerStatementModule) },
  { path: 'accounting/contra-vouchers', loadChildren: () => import('./shop/features/contra-vouchers/contra-vouchers.module').then((m) => m.ContraVouchersModule) },
  { path: 'accounting/credit-notes', loadChildren: () => import('./shop/features/credit-notes/credit-notes.module').then((m) => m.CreditNotesModule) },
  { path: 'accounting/debit-notes', loadChildren: () => import('./shop/features/debit-notes/debit-notes.module').then((m) => m.DebitNotesModule) },
  { path: 'accounting/recurring-jes', loadChildren: () => import('./shop/features/recurring-jes/recurring-jes.module').then((m) => m.RecurringJesModule) },
  { path: 'reports/gst', loadChildren: () => import('./shop/features/gst-dashboard/gst-dashboard.module').then((m) => m.GstDashboardModule) },
  { path: 'reports', loadChildren: () => import('./shop/features/reports/reports.module').then((m) => m.ReportsModule) },
  { path: 'branches', loadChildren: () => import('./shop/features/stores/stores.module').then((m) => m.StoresModule) },
  { path: 'reviews', loadChildren: () => import('./shop/features/product-reviews/product-reviews.module').then((m) => m.ProductReviewsModule) },
  { path: 'website', loadChildren: () => import('./shop/features/website-banners/website.module').then((m) => m.WebsiteModule) },
  { path: 'notifications', loadChildren: () => import('./shop/features/notifications/notifications.module').then((m) => m.NotificationsModule) },
  { path: 'settings', loadChildren: () => import('./shop/features/settings/settings.module').then((m) => m.SettingsModule) },
  { path: 'audit-log', loadChildren: () => import('./shop/features/audit-log/audit-log.module').then((m) => m.AuditLogModule) },
  { path: 'sales/list', loadChildren: () => import('./shop/features/sales/sales.module').then((m) => m.SalesModule) },
  { path: 'sales/online-orders', loadChildren: () => import('./shop/features/online-orders/online-orders.module').then((m) => m.OnlineOrdersModule) },
  { path: 'sales/returns', loadChildren: () => import('./shop/features/returns/returns.module').then((m) => m.ReturnsModule) },
  { path: 'roles', loadChildren: () => import('./shop/features/roles/roles.module').then((m) => m.RolesModule) },
  { path: 'modules', loadChildren: () => import('./shop/features/shop-modules/shop-modules.module').then((m) => m.ShopModulesModule) },
  { path: 'messaging', loadChildren: () => import('./shop/features/messaging/messaging.module').then((m) => m.MessagingModule) },
  { path: 'sales/quotations', loadChildren: () => import('./shop/features/quotations/quotations.module').then((m) => m.QuotationsModule) },
];

// The admin app is served on the platform host and at /admin on every shop host.
// A shop host (<slug>.<rootDomain> or a custom domain) opens the shop sign-in;
// the platform host and localhost open Super Admin.
function homeRedirect(): string {
  const host = window.location.hostname.toLowerCase();
  const platformHosts = [environment.rootDomain.toLowerCase(), 'localhost', '127.0.0.1'];
  return platformHosts.includes(host) ? 'platform' : 'login';
}

const ported = new Set(SHOP_SCREENS.map((route) => route.path));

const routes: Routes = [
  {
    path: 'login',
    component: TenantLoginComponent,
    data: { title: 'Shop sign in' },
  },
  {
    path: 'platform/login',
    component: LoginComponent,
    canActivate: [GuestGuard],
    data: { title: 'Sign in' },
  },
  {
    path: 'platform',
    component: ShellComponent,
    canActivate: [PlatformAuthGuard],
    children: [
      {
        path: '',
        component: DashboardComponent,
        data: { title: 'Dashboard' },
      },
      {
        path: 'tenants/new',
        component: TenantCreateComponent,
        data: { title: 'Create shop' },
      },
      {
        path: 'tenants/:id/edit',
        component: TenantEditComponent,
        data: { title: 'Edit shop' },
      },
      {
        path: 'tenants/:id/modules',
        component: TenantModulesComponent,
        data: { title: 'Shop modules' },
      },
      {
        path: 'tenants/:id/domains',
        component: TenantDomainsComponent,
        data: { title: 'Domains' },
      },
      {
        path: 'tenants',
        component: TenantListComponent,
        data: { title: 'Shops' },
      },
      {
        path: 'modules',
        component: ModuleCatalogueComponent,
        data: { title: 'Module catalogue' },
      },
      {
        path: 'roles',
        component: PlatformRolesComponent,
        data: { title: 'Roles & permissions' },
      },
      {
        path: 'users',
        component: PlatformUsersComponent,
        data: { title: 'Platform users' },
      },
      {
        path: 'audit-log',
        component: AuditLogComponent,
        data: { title: 'Audit log' },
      },
    ],
  },
  {
    path: 't/:slug/login',
    component: TenantLoginComponent,
    canActivate: [TenantGuestGuard],
    data: { title: 'Shop sign in' },
  },
  {
    path: 't/:slug',
    component: TenantShellComponent,
    canActivate: [TenantAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'overview',
        component: TenantDashboardComponent,
        data: { title: 'Shop overview' },
      },
      ...SHOP_SCREENS.map((route) => ({ ...route, canActivate: [TenantModuleGuard], canActivateChild: [TenantModuleGuard] })),
      ...flattenTenantNav()
        .filter((leaf) => !leaf.ready && !ported.has(leaf.path) && !leaf.path.startsWith('website/') && !leaf.path.startsWith('sellers/'))
        .map((leaf) => ({
          path: leaf.path,
          component: TenantModulePageComponent,
          canActivate: [TenantModuleGuard],
          data: { title: leaf.label, leaf },
        })),
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: homeRedirect },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
