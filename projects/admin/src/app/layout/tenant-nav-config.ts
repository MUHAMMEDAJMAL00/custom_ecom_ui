// Tenant Admin sidebar — ported from myskin_admin_web core/layout/nav-config.ts
// (same sections, order, labels and icons). Each leaf has a `module` key (task1.md §6):
// the sidebar shows a leaf only when that module is enabled for the tenant and the user
// holds `permission` (owner/admin roles skip the permission check, never the module check).
// `path` is relative to /t/:slug. Screens not ported yet open TenantModulePageComponent.

export interface TenantNavLeaf {
  id: string;
  label: string;
  path: string;
  icon: string;
  module: string;
  permission?: string; // module:action — omit for items every user of the module sees
  ready?: boolean; // true when the real screen exists (not the placeholder)
}

export interface TenantNavGroup {
  id: string;
  label: string;
  icon?: string;
  collapsible?: boolean; // expandable group (only "Sales", as in MySkin)
  children: TenantNavLeaf[];
}

const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  sales: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>',
  products: '<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>',
  categories: '<path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>',
  inventory: '<path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>',
  batch: '<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  units: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  taxes: '<path d="M9 14l2 2 4-4"/><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/>',
  purchases: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
  purchaseReturns: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.43"/>',
  wastage: '<path d="M16 16L12 12L8 16"/><path d="M12 12V21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
  customers: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
  vendors: '<path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>',
  users: '<path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  employees: '<path d="M16 21v-2a4 4 0 00-8 0v2"/><circle cx="12" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>',
  expenses: '<path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>',
  discounts: '<path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>',
  cash: '<path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>',
  customerPayments: '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
  supplierPayments: '<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>',
  salary: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>',
  payroll: '<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>',
  coa: '<path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z"/>',
  je: '<path d="M4 6h16M4 10h16M4 14h10"/><path d="M14 17l3 3 5-5"/>',
  contra: '<path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>',
  creditNotes: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M8 15h2"/>',
  debitNotes: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M14 15h2"/>',
  assets: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  ledger: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>',
  recurringJe: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>',
  reports: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>',
  gst: '<path d="M9 14l2 2 4-4"/><rect x="3" y="4" width="18" height="16" rx="2"/>',
  stores: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  roles: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  notifications: '<path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>',
  auditLog: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
  paymentSources: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  brands: '<path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/><circle cx="7" cy="7" r="1.5"/>',
  sellers: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
  payouts: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  settings: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>',
  banners: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
  modules: '<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>',
};

export const TENANT_NAV: TenantNavGroup[] = [
  {
    id: 'main', label: 'Main', children: [
      { id: 'dashboard', label: 'Dashboard', path: 'dashboard', icon: ICONS.dashboard, module: 'dashboard', permission: 'dashboard:read' },
      { id: 'overview', label: 'Shop Overview', path: 'overview', icon: ICONS.stores, module: 'dashboard', ready: true },
    ],
  },
  {
    id: 'sales', label: 'Sales', icon: ICONS.sales, collapsible: true, children: [
      { id: 'sales-list', label: 'Sales History', path: 'sales/list', icon: ICONS.sales, module: 'orders', permission: 'sales:read' },
      { id: 'online-orders', label: 'Online Orders', path: 'sales/online-orders', icon: ICONS.sales, module: 'online_orders', permission: 'sales:read' },
      { id: 'quotations', label: 'Quotations', path: 'sales/quotations', icon: ICONS.purchases, module: 'quotations', permission: 'quotations:read' },
      { id: 'returns', label: 'Returns', path: 'sales/returns', icon: ICONS.purchaseReturns, module: 'returns', permission: 'returns:read' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', children: [
      { id: 'products', label: 'Products', path: 'products', icon: ICONS.products, module: 'catalog', permission: 'products:read' },
      { id: 'categories', label: 'Categories', path: 'categories', icon: ICONS.categories, module: 'categories', permission: 'categories:read' },
      { id: 'brands', label: 'Brands', path: 'brands', icon: ICONS.brands, module: 'brands', permission: 'products:read' },
      { id: 'reviews', label: 'Reviews', path: 'reviews', icon: ICONS.notifications, module: 'reviews', permission: 'reviews:read' },
      { id: 'inventory', label: 'Stock Management', path: 'inventory', icon: ICONS.inventory, module: 'inventory', permission: 'inventory:read' },
      { id: 'batch-tracking', label: 'Batch Tracking', path: 'inventory/batch-tracking', icon: ICONS.batch, module: 'inventory', permission: 'inventory:read' },
      { id: 'units', label: 'Units', path: 'units', icon: ICONS.units, module: 'units', permission: 'units:read' },
      { id: 'taxes', label: 'Tax Groups', path: 'taxes', icon: ICONS.taxes, module: 'taxes', permission: 'taxes:read' },
      { id: 'purchases', label: 'Purchases', path: 'purchases', icon: ICONS.purchases, module: 'purchases', permission: 'purchases:read' },
      { id: 'purchase-returns', label: 'Purchase Returns', path: 'purchases/returns', icon: ICONS.purchaseReturns, module: 'purchases', permission: 'purchases:read' },
      { id: 'wastage-returns', label: 'Wastage & Returns', path: 'inventory/wastage-returns', icon: ICONS.wastage, module: 'wastage', permission: 'wastages:read' },
    ],
  },
  {
    id: 'marketplace', label: 'Marketplace', children: [
      { id: 'sellers', label: 'Sellers', path: 'sellers', icon: ICONS.sellers, module: 'marketplace', permission: 'sellers:read' },
      { id: 'seller-payouts', label: 'Seller Payouts', path: 'sellers/payouts', icon: ICONS.payouts, module: 'marketplace', permission: 'sellers:read' },
      { id: 'seller-settlement', label: 'Seller Settlement', path: 'sellers/settlement', icon: ICONS.reports, module: 'marketplace', permission: 'sellers:read' },
    ],
  },
  {
    id: 'people', label: 'People', children: [
      { id: 'customers', label: 'Customers', path: 'customers', icon: ICONS.customers, module: 'customers', permission: 'customers:read' },
      { id: 'newsletter', label: 'Newsletter', path: 'customers/newsletter', icon: ICONS.notifications, module: 'newsletter', permission: 'customers:read' },
      { id: 'vendors', label: 'Vendors', path: 'vendors', icon: ICONS.vendors, module: 'vendors', permission: 'vendors:read' },
      { id: 'users', label: 'Users', path: 'users', icon: ICONS.users, module: 'staff', permission: 'users:read' },
      { id: 'roles', label: 'Roles', path: 'roles', icon: ICONS.roles, module: 'roles', permission: 'roles:read' },
      { id: 'employees', label: 'Employees', path: 'employees', icon: ICONS.employees, module: 'employees', permission: 'employees:read' },
    ],
  },
  {
    id: 'finance', label: 'Finance', children: [
      { id: 'expenses', label: 'Expenses', path: 'expenses', icon: ICONS.expenses, module: 'expenses', permission: 'expenses:read' },
      { id: 'discounts', label: 'Discounts', path: 'discounts', icon: ICONS.discounts, module: 'discounts', permission: 'discounts:read' },
      { id: 'cash', label: 'Cash Register', path: 'cash', icon: ICONS.cash, module: 'pos', permission: 'cash_register:read' },
      { id: 'customer-payments', label: 'Customer Payments', path: 'customer-payments', icon: ICONS.customerPayments, module: 'customer_payments', permission: 'customer_payments:read' },
      { id: 'supplier-payments', label: 'Supplier Payments', path: 'supplier-payments', icon: ICONS.supplierPayments, module: 'supplier_payments', permission: 'supplier_payments:read' },
      { id: 'salary', label: 'Salary', path: 'salary', icon: ICONS.salary, module: 'payroll', permission: 'expenses:read' },
      { id: 'payroll', label: 'Payroll', path: 'payroll', icon: ICONS.payroll, module: 'payroll', permission: 'payroll:read' },
    ],
  },
  {
    id: 'accounting', label: 'Accounting', children: [
      { id: 'chart-of-accounts', label: 'Chart of Accounts', path: 'accounting/chart-of-accounts', icon: ICONS.coa, module: 'accounting', permission: 'account_categories:read' },
      { id: 'journal-entries', label: 'Journal Entries', path: 'accounting/journal-entries', icon: ICONS.je, module: 'accounting', permission: 'journal_entries:read' },
      { id: 'contra-vouchers', label: 'Contra Vouchers', path: 'accounting/contra-vouchers', icon: ICONS.contra, module: 'accounting', permission: 'contra_vouchers:read' },
      { id: 'credit-notes', label: 'Credit Notes', path: 'accounting/credit-notes', icon: ICONS.creditNotes, module: 'accounting', permission: 'credit_notes:read' },
      { id: 'debit-notes', label: 'Debit Notes', path: 'accounting/debit-notes', icon: ICONS.debitNotes, module: 'accounting', permission: 'debit_notes:read' },
      { id: 'assets', label: 'Assets Register', path: 'accounting/assets', icon: ICONS.assets, module: 'accounting', permission: 'assets:read' },
      { id: 'ledger-statement', label: 'Ledger Statement', path: 'accounting/ledger-statement', icon: ICONS.ledger, module: 'accounting', permission: 'journal_entries:read' },
      { id: 'recurring-jes', label: 'Recurring JEs', path: 'accounting/recurring-jes', icon: ICONS.recurringJe, module: 'accounting', permission: 'recurring_jes:read' },
    ],
  },
  {
    id: 'reports', label: 'Reports', children: [
      { id: 'reports', label: 'Reports', path: 'reports', icon: ICONS.reports, module: 'reports', permission: 'reports:read' },
      { id: 'gst-dashboard', label: 'GST Dashboard', path: 'reports/gst', icon: ICONS.gst, module: 'gst', permission: 'reports:read' },
    ],
  },
  {
    id: 'website', label: 'Website', children: [
      { id: 'home-banners', label: 'Home Banners', path: 'website/banners', icon: ICONS.banners, module: 'home_banners', permission: 'banners:read' },
      { id: 'offer-strips', label: 'Offers', path: 'website/offers', icon: ICONS.discounts, module: 'discounts', permission: 'discounts:read' },
      { id: 'home-sections', label: 'Home Sections', path: 'website/sections', icon: ICONS.categories, module: 'home_sections', permission: 'home_sections:read' },
      { id: 'website-theme', label: 'Theme & Colours', path: 'website/theme', icon: ICONS.settings, module: 'website', permission: 'home_sections:read' },
    ],
  },
  {
    id: 'system', label: 'System', children: [
      { id: 'stores', label: 'Branches', path: 'branches', icon: ICONS.stores, module: 'branches', permission: 'stores:read' },
      { id: 'notifications', label: 'Notifications', path: 'notifications', icon: ICONS.notifications, module: 'notifications' },
      { id: 'audit-log', label: 'Audit Log', path: 'audit-log', icon: ICONS.auditLog, module: 'audit_log', permission: 'audit_log:read' },
      { id: 'payment-sources', label: 'Payment Methods', path: 'payment-sources', icon: ICONS.paymentSources, module: 'payment_methods', permission: 'payment_sources:read' },
      { id: 'messaging', label: 'SMS & WhatsApp', path: 'messaging', icon: ICONS.notifications, module: 'messaging', permission: 'config:read' },
      { id: 'modules', label: 'Modules', path: 'modules', icon: ICONS.modules, module: 'settings', permission: 'config:read' },
      { id: 'settings', label: 'Settings', path: 'settings', icon: ICONS.settings, module: 'settings', permission: 'config:read' },
    ],
  },
];

export function flattenTenantNav(): TenantNavLeaf[] {
  return TENANT_NAV.flatMap((group) => group.children);
}

export function findTenantNavLeaf(path: string): TenantNavLeaf | undefined {
  return flattenTenantNav().find((leaf) => leaf.path === path);
}
