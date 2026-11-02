import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogEntry } from '../../models/audit-log.model';

const MODULE_COLORS: Record<string, string> = {
  sales: 'bg-success-subtle text-success',
  purchases: 'bg-primary-subtle text-primary',
  products: 'bg-purple-subtle text-purple',
  inventory: 'bg-teal-subtle text-teal',
  customers: 'bg-orange-subtle text-orange',
  vendors: 'bg-warning-subtle text-warning',
  users: 'bg-danger-subtle text-danger',
  expenses: 'bg-pink-subtle text-pink',
  returns: 'bg-secondary-subtle text-secondary',
  auth: 'bg-dark-subtle text-dark',
  discounts: 'bg-indigo-subtle text-indigo',
  payments: 'bg-info-subtle text-info',
  purchase_returns: 'bg-primary-subtle text-primary',
  quotations: 'bg-cyan-subtle text-cyan',
  wastage: 'bg-danger-subtle text-danger',
  employees: 'bg-teal-subtle text-teal',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-success-subtle text-success',
  update: 'bg-warning-subtle text-warning',
  delete: 'bg-danger-subtle text-danger',
  login: 'bg-primary-subtle text-primary',
  logout: 'bg-secondary-subtle text-secondary',
  approve: 'bg-success-subtle text-success',
  reject: 'bg-danger-subtle text-danger',
  payment: 'bg-info-subtle text-info',
  status_update: 'bg-warning-subtle text-warning',
};

interface DiffRow {
  key: string;
  before?: string;
  after?: string;
  value?: string;
  changed: boolean;
}

@Component({
  selector: 'app-audit-log-list',
  standalone: false,
  templateUrl: './audit-log-list.component.html',
  styleUrl: './audit-log-list.component.css',
})
export class AuditLogListComponent implements OnInit {
  logs: AuditLogEntry[] = [];
  loading = true;
  errorMessage = '';
  total = 0;

  page = 1;
  limit = 50;
  totalPages = 1;

  modules: string[] = [];
  fModule = '';
  fAction = '';
  fUser = '';
  fFrom = '';
  fTo = '';

  readonly actions = ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'payment', 'status_update'];

  detailOpen = false;
  detailEntry: AuditLogEntry | null = null;
  detailRows: DiffRow[] = [];
  detailHasBeforeAfter = false;

  constructor(private service: AuditLogService) {}

  ngOnInit(): void {
    const today = localDate(new Date());
    this.fFrom = today;
    this.fTo = today;
    this.loadModules();
    this.load();
  }

  loadModules(): void {
    this.service.getModules().subscribe({
      next: (mods) => (this.modules = (mods || []).slice().sort()),
      error: () => (this.modules = []),
    });
  }

  moduleLabel(m: string): string {
    return m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, ' ');
  }

  applyFilter(): void {
    this.page = 1;
    this.load();
  }

  reset(): void {
    this.fModule = '';
    this.fAction = '';
    this.fUser = '';
    const today = localDate(new Date());
    this.fFrom = today;
    this.fTo = today;
    this.page = 1;
    this.load();
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service
      .getAll({
        page: this.page,
        limit: this.limit,
        module: this.fModule || undefined,
        action: this.fAction || undefined,
        user_id: this.fUser || undefined,
        from: this.fFrom || undefined,
        to: this.fTo || undefined,
      })
      .subscribe({
        next: (res) => {
          this.logs = res.logs || [];
          this.totalPages = res.total_pages || 1;
          this.total = res.total ?? this.logs.length;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load audit log';
          this.loading = false;
        },
      });
  }

  onLimitChange(limit: number): void {
    this.limit = limit;
    this.page = 1;
    this.load();
  }

  userLabel(entry: AuditLogEntry): string {
    if (entry.User) return entry.User.name || entry.User.username || `User #${entry.user_id}`;
    return entry.user_id ? `#${entry.user_id}` : '—';
  }

  moduleBadgeClass(m: string): string {
    return MODULE_COLORS[m] || 'bg-secondary-subtle text-secondary';
  }

  actionBadgeClass(a: string): string {
    return ACTION_COLORS[a] || 'bg-secondary-subtle text-secondary';
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private tryParse(v: unknown): Record<string, any> | null {
    if (!v) return null;
    if (typeof v === 'object') return v as Record<string, any>;
    try {
      return JSON.parse(String(v));
    } catch {
      return null;
    }
  }

  describe(entry: AuditLogEntry): string {
    const n = this.tryParse(entry.new_values);
    const o = this.tryParse(entry.old_values);

    if (entry.action === 'create' && n) {
      const label = n['name'] || n['title'] || n['invoice_number'] || n['sale_number'] || n['purchase_number'] || n['return_number'] || n['username'] || '';
      return label ? `Created: ${label}` : 'New record created';
    }
    if (entry.action === 'update' && n && o) {
      const changed = Object.keys(n).filter((k) => JSON.stringify(n[k]) !== JSON.stringify(o[k]));
      return changed.length ? `Changed: ${changed.join(', ')}` : 'Record updated';
    }
    if (entry.action === 'update' && n) {
      const keys = Object.keys(n).slice(0, 5);
      return keys.length ? `Updated: ${keys.join(', ')}` : 'Record updated';
    }
    if (entry.action === 'delete') return 'Record deleted';
    if (entry.action === 'login') return 'Logged in';
    if (entry.action === 'logout') return 'Logged out';
    if (entry.action === 'payment' && n) return `Amount: ₹${n['amount'] ?? '—'}`;
    if (entry.action === 'approve') return 'Approved';
    if (entry.action === 'reject') return 'Rejected';
    if (n) {
      const vals = Object.values(n).filter(Boolean).map(String).slice(0, 2).join(', ');
      return vals || '—';
    }
    return '—';
  }

  // ── Detail modal ──
  openDetail(entry: AuditLogEntry): void {
    this.detailEntry = entry;

    const old = this.tryParse(entry.old_values);
    const nw = this.tryParse(entry.new_values);
    this.detailHasBeforeAfter = !!(old && nw);

    if (old && nw) {
      const allKeys = Object.keys({ ...old, ...nw });
      this.detailRows = allKeys.map((k) => ({
        key: k,
        before: this.fmtVal(old[k]),
        after: this.fmtVal(nw[k]),
        changed: JSON.stringify(old[k]) !== JSON.stringify(nw[k]),
      }));
    } else if (old || nw) {
      const vals = nw || old || {};
      this.detailRows = Object.entries(vals).map(([key, value]) => ({ key, value: this.fmtVal(value), changed: false }));
    } else {
      this.detailRows = [];
    }

    this.detailOpen = true;
  }

  closeDetail(): void {
    this.detailOpen = false;
    this.detailEntry = null;
    this.detailRows = [];
  }

  get detailTitle(): string {
    if (!this.detailEntry) return 'Log Entry';
    return this.capitalise(this.detailEntry.module || '?') + ' — ' + this.capitalise(this.detailEntry.action || '?');
  }

  get detailMeta(): string {
    if (!this.detailEntry) return '';
    const entry = this.detailEntry;
    const user = entry.User ? `${entry.User.name} (@${entry.User.username})` : entry.user_id ? `User #${entry.user_id}` : 'Unknown';
    return user + '  ·  ' + this.formatDate(entry.created_at) + (entry.ip_address ? '  ·  IP: ' + entry.ip_address : '');
  }

  private capitalise(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  }

  private fmtVal(v: unknown): string {
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'object') {
      try {
        return JSON.stringify(v);
      } catch {
        return '—';
      }
    }
    return String(v);
  }
}
