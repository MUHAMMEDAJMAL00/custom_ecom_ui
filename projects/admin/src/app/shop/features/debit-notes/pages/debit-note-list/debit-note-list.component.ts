import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { Vendor } from '../../../vendors/models/vendor.model';
import { VendorsService } from '../../../vendors/services/vendors.service';
import { DebitNote, NoteLine } from '../../models/debit-note.model';
import { DebitNotesService } from '../../services/debit-notes.service';

type DrawerMode = 'view' | 'create' | null;

interface LineRow extends NoteLine {
  idx: number;
}

@Component({
  selector: 'app-debit-note-list',
  standalone: false,
  templateUrl: './debit-note-list.component.html',
  styleUrl: './debit-note-list.component.css',
})
export class DebitNoteListComponent implements OnInit {
  notes: DebitNote[] = [];
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

  vendors: Vendor[] = [];

  drawerMode: DrawerMode = null;
  saving = false;

  viewingNote: DebitNote | null = null;

  dnDate = '';
  dnVendorId: number | null = null;
  dnRef = '';
  dnStatus: 'Outstanding' | 'Settled' = 'Outstanding';
  dnNotes = '';
  lineRows: LineRow[] = [];
  private lineIdxCounter = 0;

  constructor(
    private service: DebitNotesService,
    private vendorsService: VendorsService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadVendors();
    this.load(1);
  }

  todayISO(): string {
    return localDate(new Date());
  }

  loadVendors(): void {
    this.vendorsService.getAll({ limit: 500 }).subscribe({
      next: (res) => (this.vendors = res.data || []),
      error: () => (this.vendors = []),
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
          this.errorMessage = err.error?.message || 'Failed to load debit notes.';
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
  openView(item: DebitNote): void {
    this.viewingNote = item;
    this.drawerMode = 'view';
  }

  settle(id: number): void {
    this.service.updateStatus(id, 'Settled').subscribe({
      next: () => {
        this.notify.success('Debit note settled');
        this.closeDrawer();
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Failed to settle'),
    });
  }

  // ── Create ──
  openCreate(): void {
    this.dnDate = this.todayISO();
    this.dnVendorId = null;
    this.dnRef = '';
    this.dnStatus = 'Outstanding';
    this.dnNotes = '';
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
  }

  calcLine(row: LineRow): void {
    row.amount = (parseFloat(String(row.qty || 0)) * parseFloat(String(row.rate || 0))).toFixed(2);
  }

  get lineTotal(): number {
    return this.lineRows.reduce((sum, r) => sum + parseFloat(String(r.amount || 0)), 0);
  }

  submitCreate(): void {
    if (!this.dnDate) {
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
        date: this.dnDate,
        vendor_id: this.dnVendorId,
        reference_bill: this.dnRef.trim() || null,
        payment_status: this.dnStatus,
        notes: this.dnNotes.trim() || null,
        lines,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Debit note created');
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
    if (this.drawerMode === 'view') return 'Debit Note — ' + (this.viewingNote?.debit_note_number || '');
    return 'New Debit Note';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingNote = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'create') this.submitCreate();
  }
}
