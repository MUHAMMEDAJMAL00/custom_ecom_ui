import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreatePurchaseItem, CreatePurchasePayload, Purchase, PurchaseProduct, PurchaseVendor } from '../../models/purchase.model';
import { PurchasesService } from '../../services/purchases.service';

type DrawerMode = 'view' | 'create' | 'payment' | null;

interface ItemRow {
  idx: number;
  productId: number | null;
  variantId: number | null;
  qty: number;
  cost: number;
  batch: string;
  mfg: string;
  expiry: string;
}

@Component({
  selector: 'app-purchase-list',
  standalone: false,
  templateUrl: './purchase-list.component.html',
  styleUrl: './purchase-list.component.css',
})
export class PurchaseListComponent implements OnInit {
  purchases: Purchase[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  filterStatus = '';
  filterPayStatus = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerMode: DrawerMode = null;
  saving = false;

  // View
  viewingPurchase: Purchase | null = null;

  // Create
  vendors: PurchaseVendor[] = [];
  products: PurchaseProduct[] = [];
  itemRows: ItemRow[] = [];
  itemIdxCounter = 0;
  poVendorId: number | null = null;
  poDate = '';
  poRef = '';
  poNotes = '';

  // Payment (sub-drawer within view)
  payPurchaseId: number | null = null;
  payMaxDue = 0;
  payMethod = 'cash';
  payAmount: number | null = null;
  payRef = '';
  payNotes = '';

  constructor(
    private service: PurchasesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.poDate = this.todayISO();
    this.loadMeta();
    this.load(1);
  }

  todayISO(): string {
    return localDate(new Date());
  }

  loadMeta(): void {
    this.service.getVendors().subscribe({ next: (v) => { this.vendors = v.filter((x) => x.is_active); }, error: () => {} });
    this.service.getProducts().subscribe({ next: (p) => { this.products = p.filter((x) => x.is_active); }, error: () => {} });
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
      payment_status: this.filterPayStatus || undefined,
    }).subscribe({
      next: (res) => { this.purchases = res.data; this.totalPages = res.total_pages; this.loading = false; },
      error: (err) => { this.errorMessage = err.error?.message || 'Failed to load purchases.'; this.loading = false; },
    });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  applyFilter(): void { this.load(1); }

  // ── Status helpers ──
  statusBadgeClass(s: string): string {
    const map: Record<string, string> = { pending: 'badge-pending', received: 'badge-success', cancelled: 'badge-cancelled', partial: 'badge-warning' };
    return map[s] || 'badge-inactive';
  }

  payBadgeClass(s: string): string {
    const map: Record<string, string> = { unpaid: 'badge-cancelled', partial: 'badge-warning', paid: 'badge-success' };
    return map[s] || 'badge-inactive';
  }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── View drawer ──
  openView(item: Purchase): void {
    this.service.getById(item.id).subscribe({
      next: (p) => { this.viewingPurchase = p; this.drawerMode = 'view'; },
      error: () => this.notify.error('Failed to load purchase details'),
    });
  }

  markAsReceived(id: number): void {
    this.service.updateStatus(id, 'received').subscribe({
      next: () => {
        this.notify.success('Marked as received');
        this.closeDrawer();
        this.load();
      },
      error: () => this.notify.error('Failed to update status'),
    });
  }

  // ── Payment sub-drawer ──
  openAddPayment(purchaseId: number, due: number): void {
    this.payPurchaseId = purchaseId;
    this.payMaxDue = due;
    this.payAmount = due;
    this.payMethod = 'cash';
    this.payRef = '';
    this.payNotes = '';
    this.drawerMode = 'payment';
  }

  submitPayment(): void {
    if (!this.payAmount || this.payAmount <= 0 || !this.payPurchaseId) {
      this.notify.warning('Enter a valid amount');
      return;
    }
    if (this.payAmount > this.payMaxDue + 0.01) {
      this.notify.warning('Amount exceeds due: ₹' + this.payMaxDue.toFixed(2));
      return;
    }
    this.saving = true;
    this.service.addPayment(this.payPurchaseId, {
      payment_method: this.payMethod,
      amount: this.payAmount,
      reference_number: this.payRef.trim() || null,
      notes: this.payNotes.trim() || null,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Payment recorded');
        this.closeDrawer();
        this.load();
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed to record payment'); },
    });
  }

  // ── Create drawer ──
  openCreate(): void {
    this.poVendorId = null;
    this.poDate = this.todayISO();
    this.poRef = '';
    this.poNotes = '';
    this.itemRows = [];
    this.addItemRow();
    this.drawerMode = 'create';
  }

  addItemRow(): void {
    this.itemRows.push({ idx: this.itemIdxCounter++, productId: null, variantId: null, qty: 1, cost: 0, batch: '', mfg: '', expiry: '' });
  }

  removeItemRow(idx: number): void {
    if (this.itemRows.length <= 1) return;
    this.itemRows = this.itemRows.filter((r) => r.idx !== idx);
    this.calcTotal();
  }

  onProductChange(row: ItemRow): void {
    const product = this.products.find((p) => p.id === row.productId);
    if (product && !row.cost && product.purchase_price > 0) row.cost = product.purchase_price;
    if (product && (!product.Variants || product.Variants.filter((v) => v.is_active).length === 0)) row.variantId = null;
    this.calcTotal();
  }

  onVariantChange(row: ItemRow): void {
    const product = this.products.find((p) => p.id === row.productId);
    if (product && product.Variants) {
      const v = product.Variants.find((x) => x.id === row.variantId);
      if (v && v.purchase_price > 0) row.cost = v.purchase_price;
    }
    this.calcTotal();
  }

  selectedProductVariants(row: ItemRow): any[] {
    if (!row.productId) return [];
    const p = this.products.find((x) => x.id === row.productId);
    return (p?.Variants || []).filter((v) => v.is_active);
  }

  calcTotal(): number {
    return this.itemRows.reduce((sum, r) => sum + (r.qty || 0) * (r.cost || 0), 0);
  }

  submitCreate(): void {
    if (!this.poVendorId) { this.notify.warning('Select a vendor'); return; }
    const items: CreatePurchaseItem[] = [];
    for (const r of this.itemRows) {
      if (!r.productId) continue;
      if (!r.qty || r.qty <= 0) continue;
      items.push({
        product_id: r.productId,
        variant_id: r.variantId || undefined,
        quantity: r.qty,
        unit_cost: r.cost || 0,
        batch_number: r.batch.trim() || undefined,
        manufacturing_date: r.mfg || undefined,
        expiry_date: r.expiry || undefined,
      });
    }
    if (!items.length) { this.notify.warning('Add at least one item with a product'); return; }

    const payload: CreatePurchasePayload = {
      vendor_id: this.poVendorId,
      purchase_date: this.poDate || undefined,
      reference_number: this.poRef.trim() || undefined,
      notes: this.poNotes.trim() || undefined,
      items,
    };

    this.saving = true;
    this.service.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Purchase order created');
        this.closeDrawer();
        this.load();
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed to create purchase'); },
    });
  }

  // ── Drawer ──
  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Purchase Order — ' + (this.viewingPurchase?.purchase_number || '');
    if (this.drawerMode === 'payment') return 'Add Payment to Purchase';
    return 'New Purchase Order';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingPurchase = null;
    this.payPurchaseId = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'create') this.submitCreate();
    else if (this.drawerMode === 'payment') this.submitPayment();
  }
}
