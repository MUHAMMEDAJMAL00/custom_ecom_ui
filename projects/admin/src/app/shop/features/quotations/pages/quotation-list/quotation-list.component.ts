import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Customer } from '../../../customers/models/customer.model';
import { CustomersService } from '../../../customers/services/customers.service';
import { Product } from '../../../products/models/product.model';
import { ProductsService } from '../../../products/services/products.service';
import { Quotation, QuotationVersionRecord } from '../../models/quotation.model';
import { QuotationsService } from '../../services/quotations.service';

type DrawerMode = 'view' | 'create' | 'edit' | 'versions' | null;

interface QItemRow {
  idx: number;
  productId: number | null;
  qty: number;
  price: number | null;
}

@Component({
  selector: 'app-quotation-list',
  standalone: false,
  templateUrl: './quotation-list.component.html',
  styleUrl: './quotation-list.component.css',
})
export class QuotationListComponent implements OnInit {
  quotations: Quotation[] = [];
  loading = true;
  errorMessage = '';
  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterStatus = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  customers: Customer[] = [];
  products: Product[] = [];

  drawerMode: DrawerMode = null;
  saving = false;

  viewingQuotation: Quotation | null = null;
  versions: QuotationVersionRecord[] = [];
  loadingVersions = false;

  editId: number | null = null;
  fCustomerId: number | null = null;
  fValidUntil = '';
  fNotes = '';
  fChangeNotes = '';
  itemRows: QItemRow[] = [];
  private itemIdxCounter = 0;

  // ── Convert modal ──
  convertModalOpen = false;
  convertTargetId: number | null = null;
  convertTargetNumber = '';
  convertMethod = 'cash';
  convertAmount = 0;
  converting = false;

  constructor(
    private service: QuotationsService,
    private customersService: CustomersService,
    private productsService: ProductsService,
    private notify: NotificationService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
    this.load(1);
  }

  loadCustomers(): void {
    this.customersService.getAll({ limit: 500 }).subscribe({
      next: (res) => (this.customers = res.data || []),
      error: () => (this.customers = []),
    });
  }

  loadProducts(): void {
    this.productsService.getAll({ is_active: '1', limit: 1000 } as any).subscribe({
      next: (res) => (this.products = res.data || []),
      error: () => (this.products = []),
    });
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, status: this.filterStatus || undefined })
      .subscribe({
        next: (res) => {
          this.quotations = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load quotations';
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

  refresh(): void {
    this.load();
  }

  onLimitChange(limit: number): void {
    this.limit = limit;
    this.load(1);
  }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  formatDate(s: string | null | undefined): string {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statusBadgeClass(s: string): string {
    const map: Record<string, string> = {
      pending: 'badge-pending',
      approved: 'badge-active',
      converted: 'badge-qt-converted',
      expired: 'badge-inactive',
      cancelled: 'badge-cancelled',
      rejected: 'badge-cancelled',
    };
    return map[s] || 'badge-inactive';
  }

  canEditOrConvert(q: Quotation): boolean {
    return q.status === 'pending' || q.status === 'approved';
  }

  // ── View ──
  openView(q: Quotation): void {
    this.viewingQuotation = null;
    this.drawerMode = 'view';
    this.service.getById(q.id).subscribe({
      next: (quotation) => (this.viewingQuotation = quotation),
      error: () => {
        this.notify.error('Failed to load quotation details');
        this.closeDrawer();
      },
    });
  }

  // ── Version history ──
  openVersions(id: number): void {
    this.drawerMode = 'versions';
    this.loadingVersions = true;
    this.service.getVersions(id).subscribe({
      next: (versions) => {
        this.versions = versions;
        this.loadingVersions = false;
      },
      error: () => {
        this.versions = [];
        this.loadingVersions = false;
      },
    });
  }

  parseSnapshot(v: QuotationVersionRecord): { total_amount?: number; items?: unknown[] } {
    try {
      return JSON.parse(v.snapshot);
    } catch {
      return {};
    }
  }

  // ── Create ──
  openCreate(): void {
    this.editId = null;
    this.fCustomerId = null;
    this.fValidUntil = '';
    this.fNotes = '';
    this.fChangeNotes = '';
    this.itemIdxCounter = 0;
    this.itemRows = [];
    this.addItemRow();
    this.drawerMode = 'create';
  }

  // ── Edit ──
  openEdit(q: Quotation): void {
    this.service.getById(q.id).subscribe({
      next: (quotation) => {
        this.editId = quotation.id;
        this.fCustomerId = quotation.customer_id;
        this.fValidUntil = quotation.valid_until || '';
        this.fNotes = quotation.notes || '';
        this.fChangeNotes = '';
        this.itemIdxCounter = 0;
        this.itemRows = (quotation.items || []).map((qi) => ({
          idx: this.itemIdxCounter++,
          productId: qi.product_id,
          qty: parseFloat(String(qi.quantity)),
          price: parseFloat(String(qi.unit_price)),
        }));
        if (!this.itemRows.length) this.addItemRow();
        this.drawerMode = 'edit';
      },
      error: () => this.notify.error('Failed to load quotation'),
    });
  }

  addItemRow(): void {
    this.itemRows.push({ idx: this.itemIdxCounter++, productId: null, qty: 1, price: null });
  }

  removeItemRow(idx: number): void {
    if (this.itemRows.length <= 1) return;
    this.itemRows = this.itemRows.filter((r) => r.idx !== idx);
  }

  onProductChange(row: QItemRow): void {
    if (row.price) return;
    const product = this.products.find((p) => p.id === row.productId);
    if (product) row.price = parseFloat(String(product.selling_price)) || 0;
  }

  rowSubtotal(row: QItemRow): number {
    return (row.qty || 0) * (row.price || 0);
  }

  get grandTotal(): number {
    return this.itemRows.reduce((sum, r) => sum + this.rowSubtotal(r), 0);
  }

  private buildItemsPayload() {
    return this.itemRows
      .filter((r) => r.productId && r.qty > 0)
      .map((r) => {
        const product = this.products.find((p) => p.id === r.productId);
        return {
          product_id: r.productId as number,
          product_name: product?.name || '',
          quantity: r.qty,
          unit_price: r.price || 0,
        };
      });
  }

  submitCreate(): void {
    const items = this.buildItemsPayload();
    if (!items.length) {
      this.notify.error('Add at least one item');
      return;
    }
    const storeId = this.authService.activeStoreId;
    if (!storeId) {
      this.notify.error('No active store selected');
      return;
    }

    this.saving = true;
    this.service
      .create({
        store_id: storeId,
        items,
        customer_id: this.fCustomerId || undefined,
        valid_until: this.fValidUntil || undefined,
        notes: this.fNotes.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Quotation created');
          this.closeDrawer();
          this.load(1);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Failed to create quotation');
        },
      });
  }

  submitEdit(): void {
    if (!this.editId) return;
    const items = this.buildItemsPayload();
    if (!items.length) {
      this.notify.error('Add at least one item');
      return;
    }

    this.saving = true;
    this.service
      .update(this.editId, {
        items,
        customer_id: this.fCustomerId || null,
        valid_until: this.fValidUntil || null,
        notes: this.fNotes.trim() || null,
        change_notes: this.fChangeNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Quotation updated');
          this.closeDrawer();
          this.load();
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Failed to update quotation');
        },
      });
  }

  // ── Convert ──
  openConvertModal(q: Quotation): void {
    this.convertTargetId = q.id;
    this.convertTargetNumber = q.quotation_number || String(q.id);
    this.convertMethod = 'cash';
    this.convertAmount = 0;
    this.convertModalOpen = true;
  }

  closeConvertModal(): void {
    this.convertModalOpen = false;
    this.convertTargetId = null;
  }

  submitConvert(): void {
    if (!this.convertTargetId) return;
    this.converting = true;
    this.service.convert(this.convertTargetId, { payment_method: this.convertMethod, amount: this.convertAmount || 0 }).subscribe({
      next: () => {
        this.converting = false;
        this.notify.success('Quotation converted to sale successfully!');
        this.closeConvertModal();
        this.closeDrawer();
        this.load();
      },
      error: (err) => {
        this.converting = false;
        this.notify.error('Convert failed: ' + (err.error?.message || 'Conversion failed'));
      },
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Quotation · ' + (this.viewingQuotation?.quotation_number || '');
    if (this.drawerMode === 'edit') return 'Edit Quotation';
    if (this.drawerMode === 'versions') return 'Version History';
    return 'New Quotation';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingQuotation = null;
    this.editId = null;
    this.versions = [];
  }

  handleSave(): void {
    if (this.drawerMode === 'create') this.submitCreate();
    else if (this.drawerMode === 'edit') this.submitEdit();
  }
}
