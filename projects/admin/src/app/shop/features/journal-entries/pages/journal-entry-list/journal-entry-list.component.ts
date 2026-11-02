import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { JournalEntry, JournalLine } from '../../models/journal-entry.model';
import { JournalEntriesService } from '../../services/journal-entries.service';

@Component({
  selector: 'app-journal-entry-list',
  standalone: false,
  templateUrl: './journal-entry-list.component.html',
  styleUrl: './journal-entry-list.component.css',
})
export class JournalEntryListComponent implements OnInit {
  entries: JournalEntry[] = [];
  loading = false;
  page = 1; limit = 20; total = 1;
  search = ''; filterFrom = ''; filterTo = ''; filterManual = '';

  drawerOpen = false; drawerMode: 'view' | 'create' = 'view'; saving = false;
  viewingEntry: JournalEntry | null = null;

  // Create form
  jeDate = ''; jeDesc = '';
  jeLines: { accountId: number | null; debit: number; credit: number; note: string }[] = [];
  accounts: any[] = [];

  constructor(private service: JournalEntriesService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.jeDate = this.today();
    this.filterFrom = this.today();
    this.filterTo = this.today();
    this.loadAccounts();
    this.load();
  }

  today(): string { return localDate(new Date()); }

  loadAccounts(): void {
    // The chart-of-accounts endpoint wraps its page one level deeper ({ data: { data: [] } })
    this.service.getAccounts({ limit: 500 }).subscribe({
      next: (r: any) => { this.accounts = Array.isArray(r.data) ? r.data : (r.data?.data ?? []); },
      error: () => { this.accounts = []; },
    });
  }

  load(p?: number): void {
    this.page = p ?? this.page; this.loading = true;
    this.service.getAll({
      page: this.page, limit: this.limit, search: this.search || undefined,
      from: this.filterFrom || undefined, to: this.filterTo || undefined,
      is_manual: this.filterManual !== '' ? this.filterManual : undefined,
    }).subscribe({
      next: (r) => { this.entries = r.data; this.total = r.total_pages; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  totalDebit(entry: JournalEntry): number {
    return (entry.lines || []).reduce((s, l) => s + parseFloat(String(l.debit || 0)), 0);
  }
  totalCredit(entry: JournalEntry): number {
    return (entry.lines || []).reduce((s, l) => s + parseFloat(String(l.credit || 0)), 0);
  }

  // ── View ──
  openView(entry: JournalEntry): void {
    this.viewingEntry = entry;
    this.drawerMode = 'view';
    this.drawerOpen = true;
  }

  // ── Create ──
  openCreate(): void {
    this.jeDate = this.today();
    this.jeDesc = '';
    this.jeLines = [{ accountId: null, debit: 0, credit: 0, note: '' }, { accountId: null, debit: 0, credit: 0, note: '' }];
    this.drawerMode = 'create';
    this.drawerOpen = true;
  }

  get totalD(): number { return this.jeLines.reduce((s, l) => s + (l.debit || 0), 0); }
  get totalC(): number { return this.jeLines.reduce((s, l) => s + (l.credit || 0), 0); }
  get unbalanced(): boolean { return Math.abs(this.totalD - this.totalC) > 0.005; }

  addLine(): void { this.jeLines.push({ accountId: null, debit: 0, credit: 0, note: '' }); }
  removeLine(i: number): void { if (this.jeLines.length > 1) this.jeLines.splice(i, 1); }

  submit(): void {
    if (!this.jeDate) { this.notify.warning('Date is required'); return; }
    const lines = this.jeLines.filter((l) => l.accountId).map((l) => ({
      ledger_account_id: l.accountId,
      debit: l.debit || 0, credit: l.credit || 0,
      description: l.note.trim() || null,
    }));
    if (lines.length < 2) { this.notify.warning('At least 2 lines required'); return; }
    if (this.unbalanced) { this.notify.warning('Debit and Credit totals must be equal'); return; }
    this.saving = true;
    this.service.create({ date: this.jeDate, description: this.jeDesc.trim() || null, lines }).subscribe({
      next: () => { this.saving = false; this.notify.success('Journal entry posted'); this.drawerOpen = false; this.load(1); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); },
    });
  }

  formatCurrency(n: any): string {
    const v = parseFloat(String(n || 0));
    return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  gtZero(n: any): boolean {
    return parseFloat(String(n || 0)) > 0;
  }
}
