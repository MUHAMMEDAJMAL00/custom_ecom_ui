import { Component, OnInit, HostListener } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { Sale, SaleStats } from '../../../sales/models/sale.model';
import { OnlineOrdersService } from '../../services/online-orders.service';

@Component({
  selector: 'app-online-order-list',
  standalone: false,
  templateUrl: './online-order-list.component.html',
  styleUrl: './online-order-list.component.css',
})
export class OnlineOrderListComponent implements OnInit {
  orders: Sale[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterStatus = '';
  filterPaymentStatus = '';
  filterFrom = '';
  filterTo = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  stats: SaleStats | null = null;

  drawerMode: 'view' | null = null;
  viewingOrder: Sale | null = null;
  openStatusDropdown: number | null = null;
  dropdownTop = 0;
  dropdownLeft = 0;

  constructor(
    private service: OnlineOrdersService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    // All dates by default, so older unfulfilled orders are never hidden
    this.load();
    this.loadStats();
  }

  /** Today's date in the browser's time zone (toISOString would give the UTC date). */
  todayISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  setTodayFilter(): void {
    const today = this.todayISO();
    this.filterFrom = today;
    this.filterTo = today;
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll({
      page: this.page,
      limit: this.limit,
      source: 'online',
      search: this.search || undefined,
      status: this.filterStatus || undefined,
      payment_status: this.filterPaymentStatus || undefined,
      from: this.filterFrom || undefined,
      to: this.filterTo || undefined,
    }).subscribe({
      next: (res) => {
        this.orders = res.data;
        this.totalPages = res.total_pages;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load orders';
        this.loading = false;
      },
    });
  }

  loadStats(): void {
    this.service.getStats({
      source: 'online',
      from: this.filterFrom || undefined,
      to: this.filterTo || undefined,
      status: this.filterStatus || undefined,
    }).subscribe({
      next: (stats) => (this.stats = stats),
      error: () => (this.stats = null),
    });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.load(1);
      this.loadStats();
    }, 250);
  }

  applyFilter(): void {
    this.load(1);
    this.loadStats();
  }

  clearFilters(): void {
    this.search = '';
    this.filterStatus = '';
    this.filterPaymentStatus = '';
    this.filterFrom = '';
    this.filterTo = '';
    this.applyFilter();
  }

  refresh(): void {
    this.load();
    this.loadStats();
  }

  onLimitChange(limit: number): void {
    this.limit = limit;
    this.load(1);
  }

  openView(item: Sale): void {
    this.viewingOrder = null;
    this.drawerMode = 'view';
    this.service.getById(item.id).subscribe({
      next: (sale) => (this.viewingOrder = sale),
      error: () => {
        this.notify.error('Failed to load order details');
        this.closeDrawer();
      },
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingOrder = null;
  }

  toggleStatusDropdown(orderId: number, event?: MouseEvent): void {
    if (this.openStatusDropdown === orderId) {
      this.openStatusDropdown = null;
      this.dropdownTop = 0;
      this.dropdownLeft = 0;
      return;
    }
    this.openStatusDropdown = orderId;
    if (event) {
      const rect = (event.target as HTMLElement).closest('td')?.getBoundingClientRect();
      if (rect) {
        this.dropdownTop = rect.bottom + 2;
        this.dropdownLeft = rect.left;
      }
    }
  }

  selectStatus(order: Sale, status: string): void {
    this.openStatusDropdown = null;
    this.updateStatus(order, status);
  }

  updateStatus(order: Sale, status: string): void {
    const label: Record<string, string> = {
      confirmed: 'confirm',
      processing: 'mark as processing',
      shipped: 'mark as shipped',
      delivered: 'mark as delivered',
      cancelled: 'cancel',
    };
    const l = label[status] || status;
    this.confirmService.show({ message: `Are you sure you want to ${l} this order?` }).then((ok: boolean) => {
      if (!ok) return;
      this.service.updateStatus(order.id, status).subscribe({
        next: () => {
          this.notify.success(`Order ${label[status] || status}ed successfully`);
          this.closeDrawer();
          this.load();
          this.loadStats();
        },
        error: (err) => {
          this.notify.error(err.error?.message || `Failed to ${l} order`);
        },
      });
    });
  }

  nextStatuses(status: string): string[] {
    // Same order flow the server enforces. "completed" only exists on older orders.
    const map: Record<string, string[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'shipped', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      completed: ['processing', 'shipped', 'delivered', 'cancelled'],
    };
    return map[status] || [];
  }

  get drawerTitle(): string {
    return this.viewingOrder ? `Order #${this.viewingOrder.invoice_number || this.viewingOrder.id}` : 'Order Details';
  }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatCompact(n: number): string {
    if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  formatDate(s: string, withTime = true): string {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', withTime
      ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' });
  }

  absVal(n: number | string | undefined): number {
    return Math.abs(parseFloat(String(n || 0)));
  }

  numVal(v: number | string | undefined | null): number {
    return parseFloat(String(v || 0));
  }

  @HostListener('document:click')
  closeDropdown(): void {
    this.openStatusDropdown = null;
  }

  statusBadgeClass(s: string): string {
    const map: Record<string, string> = {
      pending: 'badge-pending',
      confirmed: 'badge-info',
      processing: 'badge-processing',
      shipped: 'badge-shipped',
      delivered: 'badge-completed',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled',
    };
    return map[s] || 'badge-inactive';
  }

  paymentBadgeClass(s: string): string {
    const map: Record<string, string> = {
      paid: 'badge-completed',
      partial: 'badge-pending',
      unpaid: 'badge-cancelled',
      refunded: 'badge-refunded',
    };
    return map[s] || '';
  }
}
