import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { Customer } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import { CreditNote, NoteLine } from '../../models/credit-note.model';
import { CreditNotesService } from '../../services/credit-notes.service';

type DrawerMode = 'view' | 'create' | null;

interface LineRow extends NoteLine {
  idx: number;
}

@Component({
  selector: 'app-credit-note-list',
  standalone: false,
  templateUrl: './credit-note-list.component.html',
  styleUrl: './credit-note-list.component.css',
})
export class CreditNoteListComponent implements OnInit {
  notes: CreditNote[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterFrom = '';
  filterTo = '';
  filterStatus = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  customers: Customer[] = [];

  drawerMode: DrawerMode = null;
  saving = false;

  viewingNote: CreditNote | null = null;

  cnDate = '';
  cnCustomerId: number | null = null;
  cnRef = '';
  cnStatus: 'Outstanding' | 'Settled' = 'Outstanding';
  cnNotes = '';
  lineRows: LineRow[] = [];
  private lineIdxCounter = 0;

  constructor(
    private service: CreditNotesService,
    private customersService: CustomersService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.load(1);
  }

  todayISO(): string {
    return localDate(new Date());
  }

  loadCustomers(): void {
    this.customersService.getAll({ limit: 500 }).subscribe({
      next: (res) => (this.customers = res.data || []),
      error: () => (this.customers = []),
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
        payment_status: this.filterStatus || undefined,
      })
      .subscribe({
        next: (res) => {
          this.notes = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load credit notes.';
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

  statusBadgeClass(status: string): string {
    return status === 'Settled' ? 'badge-success' : 'badge-warning';
  }

  formatCurrency(n: number | string): string {
    return parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── View ──
  openView(item: CreditNote): void {
    this.viewingNote = item;
    this.drawerMode = 'view';
  }

  settle(id: number): void {
    this.service.updateStatus(id, 'Settled').subscribe({
      next: () => {
        this.notify.success('Credit note settled');
        this.closeDrawer();
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to settle'),
    });
  }

  // ── Create ──
  openCreate(): void {
    this.cnDate = this.todayISO();
    this.cnCustomerId = null;
    this.cnRef = '';
    this.cnStatus = 'Outstanding';
    this.cnNotes = '';
    this.lineIdxCounter = 0;
    this.lineRows = [];
    this.addLine();
    this.drawerMode = 'create';
  }

  addLine(): void {
    this.lineRows.push({ idx: this.lineIdxCounter++, description: '', qty: 1, rate: 0, amount: 0 });
  }

  removeLine(idx: number): void {
    this.lineRows = this.lineRows.filter((r) => r.idx !== idx);
    this.recalcTotal();
  }

  calcLine(row: LineRow): void {
    row.amount = (parseFloat(String(row.qty || 0)) * parseFloat(String(row.rate || 0))).toFixed(2);
  }

  recalcTotal(): void {
    // triggers change detection re-read of lineTotal() in the template
  }

  get lineTotal(): number {
    return this.lineRows.reduce((sum, r) => sum + parseFloat(String(r.amount || 0)), 0);
  }

  submitCreate(): void {
    if (!this.cnDate) {
      this.notify.warning('Date is required');
      return;
    }
    const lines: NoteLine[] = this.lineRows
      .filter((r) => (r.description || '').trim())
      .map((r) => ({
        description: r.description.trim(),
        qty: parseFloat(String(r.qty || 1)),
        rate: parseFloat(String(r.rate || 0)),
        amount: parseFloat(String(r.amount || 0)),
      }));
    if (!lines.length) {
      this.notify.warning('At least one line item required');
      return;
    }

    this.saving = true;
    this.service
      .create({
        date: this.cnDate,
        customer_id: this.cnCustomerId,
        reference_invoice: this.cnRef.trim() || null,
        payment_status: this.cnStatus,
        notes: this.cnNotes.trim() || null,
        lines,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Credit note created');
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
    if (this.drawerMode === 'view') return 'Credit Note — ' + (this.viewingNote?.credit_note_number || '');
    return 'New Credit Note';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingNote = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'create') this.submitCreate();
  }
}
