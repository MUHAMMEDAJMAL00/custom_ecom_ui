import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { RecurringJE, RecurringJELine } from '../../models/recurring-je.model';
import { RecurringJEService } from '../../services/recurring-je.service';

@Component({
  selector: 'app-recurring-je-list',
  standalone: false,
  templateUrl: './recurring-je-list.component.html',
  styleUrl: './recurring-je-list.component.css',
})
export class RecurringJeListComponent implements OnInit {
  templates: RecurringJE[] = [];
  loading = false;
  page = 1; limit = 20; total = 1;
  search = ''; filterFreq = ''; filterActive = '';

  drawerOpen = false; editId: number | null = null; saving = false;
  accounts: any[] = [];

  // Form
  formName = ''; formDesc = ''; formFreq = 'monthly'; formDom = 1; formDow = 1;
  formStart = ''; formEnd = ''; formNotes = '';
  formLines: { accountId: number | null; debit: number; credit: number; desc: string }[] = [];

  constructor(private service: RecurringJEService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.formStart = this.today();
    this.loadAccounts();
    this.load();
  }

  today(): string { return localDate(new Date()); }

  loadAccounts(): void {
    this.service.getAccounts({ limit: 500 }).subscribe({ next: (list) => { this.accounts = list; }, error: () => {} });
  }

  load(p?: number): void {
    this.page = p ?? this.page; this.loading = true;
    this.service.getAll({
      page: this.page, limit: this.limit, search: this.search || undefined,
      frequency: this.filterFreq || undefined,
      is_active: this.filterActive !== '' ? this.filterActive : undefined,
    }).subscribe({
      next: (r) => { this.templates = r?.data || []; this.total = r?.total_pages || 1; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  openAdd(): void {
    this.editId = null;
    this.formName = ''; this.formDesc = ''; this.formFreq = 'monthly';
    this.formDom = 1; this.formDow = 1; this.formStart = this.today();
    this.formEnd = ''; this.formNotes = '';
    this.formLines = [
      { accountId: null, debit: 0, credit: 0, desc: '' },
      { accountId: null, debit: 0, credit: 0, desc: '' },
    ];
    this.drawerOpen = true;
  }

  openEdit(t: RecurringJE): void {
    this.editId = t.id;
    this.formName = t.name; this.formDesc = t.description || '';
    this.formFreq = t.frequency; this.formDom = t.day_of_month || 1;
    this.formDow = t.day_of_week ?? 1; this.formStart = t.start_date;
    this.formEnd = t.end_date || ''; this.formNotes = t.notes || '';
    const lines = (t.lines && t.lines.length >= 2) ? t.lines : [];
    this.formLines = lines.map((l) => ({
      accountId: l.ledger_account_id, debit: l.debit, credit: l.credit, desc: l.description || '',
    }));
    while (this.formLines.length < 2) this.formLines.push({ accountId: null, debit: 0, credit: 0, desc: '' });
    this.drawerOpen = true;
  }

  get totalDebit(): number { return this.formLines.reduce((s, l) => s + (l.debit || 0), 0); }
  get totalCredit(): number { return this.formLines.reduce((s, l) => s + (l.credit || 0), 0); }
  get balanced(): boolean { return Math.abs(this.totalDebit - this.totalCredit) < 0.01; }

  addLine(): void { this.formLines.push({ accountId: null, debit: 0, credit: 0, desc: '' }); }
  removeLine(i: number): void { if (this.formLines.length > 2) this.formLines.splice(i, 1); }

  save(): void {
    if (!this.formName.trim() || !this.formStart) { this.notify.warning('Name and start date required'); return; }
    const lines = this.formLines.filter((l) => l.accountId).map((l) => ({
      ledger_account_id: l.accountId, debit: l.debit || 0, credit: l.credit || 0, description: l.desc.trim() || null,
    }));
    if (lines.length < 2) { this.notify.warning('At least 2 lines required'); return; }
    if (!this.balanced) { this.notify.warning('Debit and Credit must be equal'); return; }

    const payload: any = {
      name: this.formName.trim(), description: this.formDesc.trim() || null,
      frequency: this.formFreq, start_date: this.formStart,
      end_date: this.formEnd || null, notes: this.formNotes.trim() || null, lines,
    };
    if (this.formFreq === 'monthly') payload.day_of_month = this.formDom;
    if (this.formFreq === 'weekly') payload.day_of_week = this.formDow;

    this.saving = true;
    const obs = this.editId ? this.service.update(this.editId, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => { this.saving = false; this.notify.success(this.editId ? 'Updated' : 'Created'); this.drawerOpen = false; this.load(); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); },
    });
  }

  deleteTemplate(t: RecurringJE): void {
    if (!confirm('Deactivate "' + t.name + '"?')) return;
    this.service.remove(t.id).subscribe({ next: () => { this.notify.success('Deactivated'); this.load(); }, error: () => this.notify.error('Failed') });
  }

  generateDue(): void {
    if (!confirm('Generate journal entries for all due templates?')) return;
    this.service.generate().subscribe({
      next: (res) => { this.notify.success('Generated ' + res.generated + ' journal entr' + (res.generated === 1 ? 'y' : 'ies')); this.load(); },
      error: (err) => { this.notify.error(err.error?.message || 'Generation failed'); },
    });
  }

  freqLabel(t: RecurringJE): string {
    return t.frequency + (t.frequency === 'monthly' && t.day_of_month ? ' (day ' + t.day_of_month + ')' : '');
  }

  formatCurrency(n: number): string { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
}
