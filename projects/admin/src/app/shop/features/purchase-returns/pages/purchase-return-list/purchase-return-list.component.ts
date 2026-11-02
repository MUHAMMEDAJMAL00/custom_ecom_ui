import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreatePurchaseReturnItem, PurchaseRef, PurchaseReturn, PurchaseReturnProduct, PurchaseReturnVendor } from '../../models/purchase-return.model';
import { PurchaseReturnsService } from '../../services/purchase-returns.service';

type DrawerMode = 'view' | 'create' | null;

interface ReturnItemRow {
  idx: number;
  productId: number | null;
  productName: string;
  qty: number;
  price: number;
  /** GST % of the purchased item (from the purchase line, else the product) */
  taxRate: number;
  stock: string;
  inSearch: boolean;
}

@Component({
  selector: 'app-purchase-return-list',
  standalone: false,
  templateUrl: './purchase-return-list.component.html',
  styleUrl: './purchase-return-list.component.css',
})
export class PurchaseReturnListComponent implements OnInit {
  returns: PurchaseReturn[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterStatus = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerMode: DrawerMode = null;
  saving = false;

  vendRows: PurchaseReturnVendor[] = [];
  products: PurchaseReturnProduct[] = [];
  productSearchResults: PurchaseReturnProduct[] = [];
  productSearchIdx: number | null = null;
  productSearchQuery = '';

  // View
  viewingReturn: PurchaseReturn | null = null;

  // Create
  vendors: PurchaseReturnVendor[] = [];
  prVendorId: number | null = null;
  prPurchaseId: number | null = null;
  prDate = '';
  prRefundMethod = 'adjustment';
  prReason = '';
  itemRows: ReturnItemRow[] = [];
  itemIdxCounter = 0;
  availablePurchases: PurchaseRef[] = [];

  constructor(
    private service: PurchaseReturnsService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.prDate = this.todayISO();
    this.loadMeta();
    this.load(1);
  }

  todayISO(): string {
    return localDate(new Date());
  }

  loadMeta(): void {
    this.service.getVendors().subscribe({ next: (v) => { this.vendors = v.filter((x) => x.is_active); }, error: () => {} });
    this.service.getProducts({ limit: 999, is_active: 1 }).subscribe({ next: (p) => { this.products = p; }, error: () => {} });
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll({
      page: this.page,
      limit: this.limit,
      search: this.search || undefined,
      status: this.filterStatus || undefined,
    }).subscribe({
      next: (res) => { this.returns = res.data; this.totalPages = res.total_pages; this.loading = false; },
      error: (err) => { this.errorMessage = err.error?.message || 'Failed to load.'; this.loading = false; },
    });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  applyFilter(): void { this.load(1); }

  helper_statusBadge(s: string): string {
    const map: Record<string, string> = { draft: 'badge-pending', approved: 'badge-info', completed: 'badge-success', rejected: 'badge-cancelled' };
    return map[s] || 'badge-inactive';
  }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── View ──
  openView(item: PurchaseReturn): void {
    this.service.getById(item.id).subscribe({
      next: (p) => { this.viewingReturn = p; this.drawerMode = 'view'; },
      error: () => this.notify.error('Failed to load return details'),
    });
  }

  // ── Create ──
  openCreate(): void {
    this.prVendorId = null;
    this.prPurchaseId = null;
    this.prDate = this.todayISO();
    this.prRefundMethod = 'adjustment';
    this.prReason = '';
    this.itemRows = [];
    this.availablePurchases = [];
    this.addItemRow();
    this.drawerMode = 'create';
  }

  onVendorChange(): void {
    this.prPurchaseId = null;
    this.availablePurchases = [];
    this.itemRows = [];
    this.addItemRow();
    if (!this.prVendorId) return;
    this.service.getPurchasesWithRemaining(this.prVendorId).subscribe({
      next: (list) => { this.availablePurchases = list; },
      error: () => {},
    });
  }

  onPurchaseChange(): void {
    this.itemRows = [];
    this.itemIdxCounter = 0;
    if (!this.prPurchaseId) { this.addItemRow(); return; }
    this.service.getPurchaseItems(this.prPurchaseId).subscribe({
      next: (items) => {
        if (!items || !items.length) { this.addItemRow(); return; }
        for (const pi of items) {
          const pname = pi.product_name || (pi.Product?.name) || '';
          this.itemRows.push({
            idx: this.itemIdxCounter++,
            productId: pi.product_id,
            productName: pname,
            qty: pi.quantity,
            price: pi.unit_cost || 0,
            taxRate: Number((pi as any).tax_rate) || 0,
            stock: '',
            inSearch: false,
          });
          this.fetchStock(this.itemRows[this.itemRows.length - 1]);
        }
        this.calcTotal();
      },
      error: () => { this.addItemRow(); },
    });
  }

  addItemRow(): void {
    this.itemRows.push({
      idx: this.itemIdxCounter++,
      productId: null,
      productName: '',
      qty: 1,
      price: 0,
      taxRate: 0,
      stock: '',
      inSearch: false,
    });
  }

  removeItemRow(idx: number): void {
    if (this.itemRows.length <= 1) return;
    this.itemRows = this.itemRows.filter((r) => r.idx !== idx);
    this.calcTotal();
  }

  onSearchProductFocus(row: ReturnItemRow): void {
    this.productSearchIdx = row.idx;
    this.productSearchQuery = row.productName;
    this.filterProducts();
    row.inSearch = true;
  }

  onSearchProductInput(row: ReturnItemRow, value: string): void {
    row.productId = null;
    row.productName = value;
    this.productSearchIdx = row.idx;
    this.productSearchQuery = value;
    this.filterProducts();
  }

  onSearchProductBlur(row: ReturnItemRow): void {
    setTimeout(() => { row.inSearch = false; }, 180);
  }

  filterProducts(): void {
    const q = this.productSearchQuery.toLowerCase().trim();
    this.productSearchResults = !q
      ? this.products.slice(0, 60)
      : this.products.filter((p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
        ).slice(0, 60);
  }

  selectProduct(row: ReturnItemRow, product: PurchaseReturnProduct): void {
    row.productId = product.id;
    row.productName = product.name;
    if (!row.price && product.purchase_price > 0) row.price = product.purchase_price;
    if (!row.taxRate) row.taxRate = Number(product.tax_rate) || 0;
    row.inSearch = false;
    this.calcTotal();
    this.fetchStock(row);
  }

  fetchStock(row: ReturnItemRow): void {
    if (!row.productId) return;
    row.stock = '…';
    this.service.getInventory(row.productId).subscribe({
      next: (res) => {
        const invs: any[] = res?.inventories || [];
        const inv = invs.find((i: any) => i.store_id);
        const qty = inv ? parseFloat(inv.quantity) : 0;
        row.stock = 'Stock: ' + qty;
      },
      error: () => { row.stock = ''; },
    });
  }

  scanBarcode(barcode: string): void {
    if (!barcode.trim()) return;
    this.service.scanBarcode(barcode.trim()).subscribe({
      next: (product) => {
        if (!product || !product.id) { this.notify.warning('No product matched barcode'); return; }
        let emptyRow = this.itemRows.find((r) => !r.productId);
        if (!emptyRow) { this.addItemRow(); emptyRow = this.itemRows[this.itemRows.length - 1]; }
        this.selectProduct(emptyRow, product);
        this.notify.success('Added: ' + product.name);
      },
      error: () => { this.notify.warning('No product matched barcode'); },
    });
  }

  calcTotal(): number {
    return this.itemRows.reduce((sum, r) => sum + (r.qty || 0) * (r.price || 0), 0);
  }

  submitCreate(): void {
    if (!this.prVendorId) { this.notify.warning('Select a vendor'); return; }

    const items: CreatePurchaseReturnItem[] = [];
    for (const r of this.itemRows) {
      if (!r.productId || !r.qty || r.qty <= 0) continue;
      items.push({ product_id: r.productId, quantity: r.qty, unit_price: r.price || 0, tax_rate: r.taxRate || 0 });
    }
    if (!items.length) { this.notify.warning('Add at least one item'); return; }

    this.saving = true;
    this.service.create({
      vendor_id: this.prVendorId,
      purchase_id: this.prPurchaseId || null,
      return_date: this.prDate || undefined,
      reason: this.prReason.trim() || undefined,
      refund_method: this.prRefundMethod,
      items,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Purchase return created');
        this.closeDrawer();
        this.load();
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed to create'); },
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Return · ' + (this.viewingReturn?.return_number || '');
    return 'New Purchase Return';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingReturn = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'create') this.submitCreate();
  }
}
