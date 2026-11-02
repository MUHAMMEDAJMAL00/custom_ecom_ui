import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Vendor, VendorPayment, VendorPurchase } from '../../models/vendor.model';
import { VendorsService } from '../../services/vendors.service';

type DrawerMode = 'form' | 'view' | null;
type ViewTab = 'purchases' | 'payments';

@Component({
  selector: 'app-vendor-list',
  standalone: false,
  templateUrl: './vendor-list.component.html',
  styleUrl: './vendor-list.component.css',
})
export class VendorListComponent implements OnInit {
  vendors: Vendor[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;

  viewingVendor: Vendor | null = null;
  activeTab: ViewTab = 'purchases';
  tabLoading = false;
  purchases: VendorPurchase[] = [];
  payments: VendorPayment[] = [];

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private vendorsService: VendorsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      company: [''],
      phone: [''],
      email: [''],
      tax_number: [''],
      opening_balance: [0],
      address: [''],
      notes: [''],
      is_active: [1],
    });
  }

  ngOnInit(): void {
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.vendorsService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.vendors = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load vendors.';
          this.loading = false;
        },
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  onFilterChange(): void {
    this.load(1);
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  formatCurrency(n: number | string): string {
    return parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', company: '', phone: '', email: '', tax_number: '', opening_balance: 0, address: '', notes: '', is_active: 1 });
    this.drawerMode = 'form';
  }

  openEdit(vendor: Vendor): void {
    this.vendorsService.getById(vendor.id).subscribe({
      next: (v) => {
        this.editId = v.id;
        this.form.reset({
          name: v.name,
          company: v.company || '',
          phone: v.phone || '',
          email: v.email || '',
          tax_number: v.tax_number || '',
          opening_balance: v.balance,
          address: v.address || '',
          notes: v.notes || '',
          is_active: v.is_active,
        });
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load vendor'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return `Vendor Details — ${this.viewingVendor?.name ?? ''}`;
    return this.editId ? 'Edit Vendor' : 'Add Vendor';
  }

  handleSave(): void {
    if (this.form.invalid) {
      this.notify.warning('Name is required');
      return;
    }
    const raw = this.form.getRawValue();
    const payload: Partial<Vendor> = {
      name: (raw.name || '').trim(),
      company: raw.company?.trim() || null,
      phone: raw.phone?.trim() || null,
      email: raw.email?.trim() || null,
      tax_number: raw.tax_number?.trim() || null,
      address: raw.address?.trim() || null,
      notes: raw.notes?.trim() || null,
    };
    if (!this.editId) {
      const ob = parseFloat(String(raw.opening_balance || 0));
      if (!isNaN(ob) && ob > 0) payload.opening_balance = ob;
    } else {
      payload.is_active = raw.is_active ?? 1;
    }

    this.saving = true;
    const request$ = this.editId ? this.vendorsService.update(this.editId, payload) : this.vendorsService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Vendor updated' : 'Vendor created');
        this.closeDrawer();
        this.load(1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  // ── View ───────────────────────────────────────────────────
  openView(vendor: Vendor): void {
    this.viewingVendor = vendor;
    this.drawerMode = 'view';
    this.activeTab = 'purchases';
    this.loadPurchases(vendor.id);
  }

  switchTab(tab: ViewTab): void {
    if (!this.viewingVendor) return;
    this.activeTab = tab;
    if (tab === 'purchases') this.loadPurchases(this.viewingVendor.id);
    else this.loadPayments(this.viewingVendor.id);
  }

  private loadPurchases(vendorId: number): void {
    this.tabLoading = true;
    this.vendorsService.getPurchases(vendorId).subscribe({
      next: (rows) => {
        this.purchases = rows;
        this.tabLoading = false;
      },
      error: () => (this.tabLoading = false),
    });
  }

  private loadPayments(vendorId: number): void {
    this.tabLoading = true;
    this.vendorsService.getPayments(vendorId).subscribe({
      next: (rows) => {
        this.payments = rows;
        this.tabLoading = false;
      },
      error: () => (this.tabLoading = false),
    });
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(vendor: Vendor): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Deactivate Vendor',
      message: `Deactivate "${vendor.name}"?`,
      note: 'Vendor will be set to inactive.',
      confirmLabel: 'Deactivate',
    });
    if (!confirmed) return;

    this.vendorsService.remove(vendor.id).subscribe({
      next: () => {
        this.notify.success('Vendor deactivated');
        this.load(1);
      },
      error: () => this.notify.error('Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingVendor = null;
    this.editId = null;
  }
}
