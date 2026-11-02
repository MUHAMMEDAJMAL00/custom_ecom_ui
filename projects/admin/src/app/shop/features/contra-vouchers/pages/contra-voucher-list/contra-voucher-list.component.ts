import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { ChartOfAccountsService } from '../../../chart-of-accounts/services/chart-of-accounts.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ContraVoucher, LedgerAccountRef } from '../../models/contra-voucher.model';
import { ContraVouchersService } from '../../services/contra-vouchers.service';

type DrawerMode = 'view' | 'create' | null;

@Component({
  selector: 'app-contra-voucher-list',
  standalone: false,
  templateUrl: './contra-voucher-list.component.html',
  styleUrl: './contra-voucher-list.component.css',
})
export class ContraVoucherListComponent implements OnInit {
  vouchers: ContraVoucher[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterFrom = '';
  filterTo = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  accounts: LedgerAccountRef[] = [];
  readonly paymentModes = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI'];

  drawerMode: DrawerMode = null;
  saving = false;

  viewingVoucher: ContraVoucher | null = null;

  cvDate = '';
  cvAmount: number | null = null;
  cvFromAccountId: number | null = null;
  cvToAccountId: number | null = null;
  cvPaymentMode = '';
  cvNotes = '';

  constructor(
    private service: ContraVouchersService,
    private coaService: ChartOfAccountsService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    const today = this.todayISO();
    this.filterFrom = today;
    this.filterTo = today;
    this.loadAccounts();
    this.load(1);
  }

  todayISO(): string {
    return localDate(new Date());
  }

  loadAccounts(): void {
    this.coaService.getAccounts({ limit: 200 }).subscribe({
      next: (res) => (this.accounts = res.data || []),
      error: () => (this.accounts = []),
    });
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
        from: this.filterFrom || undefined,
        to: this.filterTo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.vouchers = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load vouchers.';
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

  formatCurrency(n: number | string): string {
    return parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return s;
  }

  // ── View ──
  openView(item: ContraVoucher): void {
    this.viewingVoucher = item;
    this.drawerMode = 'view';
  }

  // ── Create ──
  openCreate(): void {
    this.cvDate = this.todayISO();
    this.cvAmount = null;
    this.cvFromAccountId = null;
    this.cvToAccountId = null;
    this.cvPaymentMode = '';
    this.cvNotes = '';
    this.drawerMode = 'create';
  }

  submitCreate(): void {
    if (!this.cvDate) {
      this.notify.warning('Date is required');
      return;
    }
    if (!this.cvAmount || this.cvAmount <= 0) {
      this.notify.warning('Amount must be > 0');
      return;
    }
    if (!this.cvFromAccountId) {
      this.notify.warning('From account required');
      return;
    }
    if (!this.cvToAccountId) {
      this.notify.warning('To account required');
      return;
    }
    if (this.cvFromAccountId === this.cvToAccountId) {
      this.notify.warning('From and To accounts must differ');
      return;
    }

    this.saving = true;
    this.service
      .create({
        date: this.cvDate,
        amount: this.cvAmount,
        from_account_id: this.cvFromAccountId,
        to_account_id: this.cvToAccountId,
        payment_mode: this.cvPaymentMode || null,
        notes: this.cvNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Voucher posted');
          this.closeDrawer();
          this.load(1);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Save failed');
        },
      });
  }

  get drawerTitle(): string {
    return this.drawerMode === 'view' ? 'Contra Voucher' : 'New Contra Voucher';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingVoucher = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'create') this.submitCreate();
  }
}
