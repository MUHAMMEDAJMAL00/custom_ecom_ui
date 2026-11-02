import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { LedgerStatementData } from '../../models/ledger-statement.model';
import { LedgerStatementService } from '../../services/ledger-statement.service';

@Component({
  selector: 'app-ledger-statement-list',
  standalone: false,
  templateUrl: './ledger-statement-list.component.html',
  styleUrl: './ledger-statement-list.component.css',
})
export class LedgerStatementListComponent implements OnInit {
  accounts: any[] = [];
  filterAccount = '';
  filterFrom = '';
  filterTo = '';

  statement: LedgerStatementData | null = null;
  loading = false;
  loaded = false;

  constructor(private service: LedgerStatementService, private notify: NotificationService) {}

  ngOnInit(): void {
    const d = localDate(new Date());
    this.filterFrom = d;
    this.filterTo = d;
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.service.getAccounts({ limit: 500 }).subscribe({ next: (list) => { this.accounts = list; }, error: () => {} });
  }

  loadStatement(): void {
    if (!this.filterAccount) { this.notify.warning('Please select an account'); return; }
    this.loading = true;
    this.loaded = true;
    this.statement = null;
    const params: any = {};
    if (this.filterFrom) params.from = this.filterFrom;
    if (this.filterTo) params.to = this.filterTo;
    this.service.getAccountStatement(parseInt(this.filterAccount, 10), params).subscribe({
      next: (data) => { this.statement = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  totalDebit(): number { return (this.statement?.lines ?? []).reduce((s, l) => s + (l.debit || 0), 0); }
  totalCredit(): number { return (this.statement?.lines ?? []).reduce((s, l) => s + (l.credit || 0), 0); }

  humanizeRef(type: string | null | undefined): string {
    const map: Record<string, string> = {
      journal_entries: 'Journal Entry', journal_entry: 'Journal Entry',
      opening_balance: 'Opening Balance', sales: 'Sale', purchases: 'Purchase',
      customer_payment: 'Payment', supplier_payment: 'Payment',
      expense: 'Expense', payroll: 'Payroll', cash: 'Cash',
      credit_note: 'Credit Note', debit_note: 'Debit Note',
      contra_voucher: 'Contra Voucher', depreciation: 'Depreciation',
    };
    return map[type || ''] || (type ? type.replace(/_/g, ' ') : 'Manual');
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    if (d.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const p = d.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d.split('T')[0] || '—';
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(n: number | undefined | null): string { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
}
