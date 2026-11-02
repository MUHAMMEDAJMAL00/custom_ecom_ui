import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { BatchRow, BatchStatus } from '../../models/batch.model';
import { BatchTrackingService } from '../../services/batch-tracking.service';

const WARN_MS = 30 * 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-batch-tracking-home',
  standalone: false,
  templateUrl: './batch-tracking-home.component.html',
  styleUrl: './batch-tracking-home.component.css',
})
export class BatchTrackingHomeComponent implements OnInit {
  private allRows: BatchRow[] = [];
  rows: BatchRow[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  statTotal = 0;
  statActive = 0;
  statExpiring = 0;
  statExpired = 0;

  constructor(
    private batchTrackingService: BatchTrackingService,
    private auth: AuthService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.batchTrackingService.getBatches({ store_id: this.auth.activeStoreId ?? undefined, limit: 500, page: 1 }).subscribe({
      next: (rows) => {
        this.allRows = rows;
        this.renderStats();
        this.page = 1;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load. Check your connection.';
        this.loading = false;
      },
    });
  }

  private today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private parseDate(str: string | null): Date | null {
    if (!str) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return new Date(str + 'T00:00:00');
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  getStatus(expiryDate: string | null): BatchStatus {
    if (!expiryDate) return 'active';
    const exp = this.parseDate(expiryDate);
    if (!exp) return 'active';
    exp.setHours(0, 0, 0, 0);
    const today = this.today();
    if (exp < today) return 'expired';
    if (exp.getTime() - today.getTime() <= WARN_MS) return 'expiring';
    return 'active';
  }

  statusBadgeClass(status: BatchStatus): string {
    return { active: 'badge-active', expiring: 'badge-warning', expired: 'badge-cancelled' }[status];
  }

  statusLabel(status: BatchStatus): string {
    return { active: 'Active', expiring: 'Expiring Soon', expired: 'Expired' }[status];
  }

  rowClass(row: BatchRow): string {
    const status = this.getStatus(row.expiry_date);
    return status === 'expiring' ? 'row-expiring' : status === 'expired' ? 'row-expired' : '';
  }

  private renderStats(): void {
    let active = 0;
    let expiring = 0;
    let expired = 0;
    this.allRows.forEach((b) => {
      const s = this.getStatus(b.expiry_date);
      if (s === 'active') active++;
      else if (s === 'expiring') expiring++;
      else expired++;
    });
    this.statTotal = this.allRows.length;
    this.statActive = active;
    this.statExpiring = expiring;
    this.statExpired = expired;
  }

  private filtered(): BatchRow[] {
    const q = this.search.toLowerCase();
    return this.allRows.filter((b) => {
      if (this.statusFilter && this.getStatus(b.expiry_date) !== this.statusFilter) return false;
      if (q) {
        const name = (b.Product?.name || '').toLowerCase();
        const sku = (b.Product?.sku || '').toLowerCase();
        const bn = (b.batch_number || '').toLowerCase();
        if (!name.includes(q) && !sku.includes(q) && !bn.includes(q)) return false;
      }
      return true;
    });
  }

  applyFilters(): void {
    const filtered = this.filtered();
    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.limit));
    if (this.page > this.totalPages) this.page = 1;
    const offset = (this.page - 1) * this.limit;
    this.rows = filtered.slice(offset, offset + this.limit);
  }

  goToPage(page: number): void {
    this.page = page;
    this.applyFilters();
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page = 1;
      this.applyFilters();
    }, 300);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.applyFilters();
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10) || 20;
    this.page = 1;
    this.applyFilters();
  }

  quantityDisplay(b: BatchRow): string {
    return String(b.current_quantity ?? 0);
  }
}
