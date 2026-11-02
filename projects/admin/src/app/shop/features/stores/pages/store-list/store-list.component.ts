import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Store } from '../../models/store.model';
import { StoresService } from '../../services/stores.service';

type DrawerMode = 'view' | 'create' | 'edit' | null;

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'MYR', 'THB'];
const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Kuala_Lumpur',
  'Asia/Bangkok', 'Asia/Tokyo', 'Asia/Shanghai',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Australia/Sydney',
];

@Component({
  selector: 'app-store-list',
  standalone: false,
  templateUrl: './store-list.component.html',
  styleUrl: './store-list.component.css',
})
export class StoreListComponent implements OnInit {
  stores: Store[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterStatus = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  readonly currencies = CURRENCIES;
  readonly timezones = TIMEZONES;

  drawerMode: DrawerMode = null;
  saving = false;
  editId: number | null = null;
  viewingStore: Store | null = null;

  fName = '';
  fCode = '';
  fPhone = '';
  fEmail = '';
  fCurrency = 'INR';
  fTimezone = 'Asia/Kolkata';
  fAddress = '';
  fActive = 1;
  fAllowNegative = false;

  constructor(
    private service: StoresService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.load(1);
  }

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin;
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service
      .getAll({
        page: this.page,
        limit: this.limit,
        search: this.search || undefined,
        is_active: this.filterStatus || undefined,
      })
      .subscribe({
        next: (res) => {
          this.stores = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load stores.';
          this.loading = false;
        },
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  applyFilter(): void {
    this.load(1);
  }

  timezoneShort(tz: string): string {
    return (tz || '').split('/').pop() || '—';
  }

  // ── View ──
  openView(item: Store): void {
    this.viewingStore = item;
    this.drawerMode = 'view';
  }

  // ── Add ──
  openCreate(): void {
    if (!this.isSuperAdmin) {
      this.notify.warning('Only super administrators can create stores. Please contact your system admin.');
      return;
    }
    this.editId = null;
    this.fName = '';
    this.fCode = '';
    this.fPhone = '';
    this.fEmail = '';
    this.fCurrency = 'INR';
    this.fTimezone = 'Asia/Kolkata';
    this.fAddress = '';
    this.fActive = 1;
    this.fAllowNegative = false;
    this.drawerMode = 'create';
  }

  // ── Edit ──
  openEdit(item: Store): void {
    this.service.getById(item.id).subscribe({
      next: (s) => {
        this.editId = s.id;
        this.fName = s.name || '';
        this.fCode = s.code || '';
        this.fPhone = s.phone || '';
        this.fEmail = s.email || '';
        this.fCurrency = s.currency || 'INR';
        this.fTimezone = s.timezone || 'Asia/Kolkata';
        this.fAddress = s.address || '';
        this.fActive = s.is_active !== 0 ? 1 : 0;
        this.fAllowNegative = !!s.allow_negative_stock;
        this.drawerMode = 'edit';
      },
      error: () => this.notify.error('Could not load store'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Store Details';
    return this.drawerMode === 'edit' ? 'Edit Store' : 'Add Store';
  }

  get saveLabel(): string {
    return this.drawerMode === 'edit' ? 'Update Store' : 'Save Store';
  }

  submitSave(): void {
    if (!this.fName.trim()) {
      this.notify.warning('Store name is required');
      return;
    }
    if (!this.editId && !this.fCode.trim()) {
      this.notify.warning('Store code is required');
      return;
    }

    const payload = {
      name: this.fName.trim(),
      phone: this.fPhone.trim() || null,
      email: this.fEmail.trim() || null,
      currency: this.fCurrency,
      timezone: this.fTimezone,
      address: this.fAddress.trim() || null,
      is_active: this.fActive,
      allow_negative_stock: this.fAllowNegative ? 1 : 0,
      ...(this.editId ? {} : { code: this.fCode.trim().toUpperCase() }),
    };

    this.saving = true;
    const request$ = this.editId ? this.service.update(this.editId, payload) : this.service.create(payload as any);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Store updated' : 'Store created');
        this.closeDrawer();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  // ── Delete ──
  async confirmDelete(item: Store): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Store',
      message: `Delete store "${item.name}"?`,
      note: 'The store will be deactivated and removed from the list.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.service.remove(item.id).subscribe({
      next: () => {
        this.notify.success('Store deleted');
        this.load();
      },
      error: () => this.notify.error('Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingStore = null;
    this.editId = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'create' || this.drawerMode === 'edit') this.submitSave();
  }
}
