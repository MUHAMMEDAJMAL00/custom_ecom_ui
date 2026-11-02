import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Customer, LoyaltyTransaction } from '../../models/customer.model';
import { CustomersService } from '../../services/customers.service';

type DrawerMode = 'form' | 'view' | null;

@Component({
  selector: 'app-customer-list',
  standalone: false,
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.css',
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
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

  form: ReturnType<FormBuilder['group']>;

  viewingCustomer: Customer | null = null;
  loyaltyHistory: LoyaltyTransaction[] = [];
  loyaltyHistoryLoading = false;
  adjustPoints: number | null = null;
  adjustNotes = '';

  constructor(
    private fb: FormBuilder,
    private customersService: CustomersService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      email: [''],
      date_of_birth: [''],
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
    this.customersService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.customers = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load customers.';
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

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', phone: '', email: '', date_of_birth: '', opening_balance: 0, address: '', notes: '', is_active: 1 });
    this.drawerMode = 'form';
  }

  openEdit(customer: Customer): void {
    this.customersService.getById(customer.id).subscribe({
      next: (c) => {
        this.editId = c.id;
        this.form.reset({
          name: c.name,
          phone: c.phone || '',
          email: c.email || '',
          date_of_birth: c.date_of_birth || '',
          opening_balance: c.balance,
          address: c.address || '',
          notes: c.notes || '',
          is_active: c.is_active,
        });
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load customer'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return `Customer Details — ${this.viewingCustomer?.name ?? ''}`;
    return this.editId ? 'Edit Customer' : 'Add Customer';
  }

  handleSave(): void {
    if (this.form.invalid) {
      this.notify.warning('Name is required');
      return;
    }
    const raw = this.form.getRawValue();
    const payload: Partial<Customer> = {
      name: (raw.name || '').trim(),
      phone: raw.phone?.trim() || null,
      email: raw.email?.trim() || null,
      date_of_birth: raw.date_of_birth || null,
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
    const request$ = this.editId ? this.customersService.update(this.editId, payload) : this.customersService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Customer updated' : 'Customer created');
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
  openView(customer: Customer): void {
    this.viewingCustomer = customer;
    this.drawerMode = 'view';
    this.adjustPoints = null;
    this.adjustNotes = '';
    this.loadLoyaltyHistory(customer.id);
  }

  private loadLoyaltyHistory(customerId: number): void {
    this.loyaltyHistoryLoading = true;
    this.customersService.getLoyaltyHistory(customerId).subscribe({
      next: (rows) => {
        this.loyaltyHistory = rows;
        this.loyaltyHistoryLoading = false;
      },
      error: () => {
        this.loyaltyHistoryLoading = false;
      },
    });
  }

  applyLoyaltyAdjustment(): void {
    if (!this.viewingCustomer || !this.adjustPoints) {
      this.notify.warning('Enter a valid points value (positive or negative)');
      return;
    }
    this.customersService.adjustLoyalty(this.viewingCustomer.id, this.adjustPoints, this.adjustNotes.trim() || null).subscribe({
      next: () => {
        this.notify.success('Loyalty points updated');
        this.adjustPoints = null;
        this.adjustNotes = '';
        this.loadLoyaltyHistory(this.viewingCustomer!.id);
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to adjust points'),
    });
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(customer: Customer): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Deactivate Customer',
      message: `Deactivate "${customer.name}"?`,
      note: 'Customer will be set to inactive.',
      confirmLabel: 'Deactivate',
    });
    if (!confirmed) return;

    this.customersService.remove(customer.id).subscribe({
      next: () => {
        this.notify.success('Customer deactivated');
        this.load(1);
      },
      error: () => this.notify.error('Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingCustomer = null;
    this.editId = null;
  }

  formatCurrency(n: number | string): string {
    return parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
