import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdjustType, InventoryRow, ProductInventoryDetail, ProductSearchResult, StockMovement, StoreRef } from '../../models/inventory.model';
import { InventoryService } from '../../services/inventory.service';

type Tab = 'stock' | 'movements' | 'transfer';

@Component({
  selector: 'app-inventory-home',
  standalone: false,
  templateUrl: './inventory-home.component.html',
  styleUrl: './inventory-home.component.css',
})
export class InventoryHomeComponent implements OnInit {
  activeTab: Tab = 'stock';

  // ── Stock Status tab ─────────────────────────────
  stockRows: InventoryRow[] = [];
  stockLoading = true;
  stockPage = 1;
  stockLimit = 20;
  stockTotalPages = 1;
  stockSearch = '';
  private stockSearchDebounce?: ReturnType<typeof setTimeout>;

  statTotal = 0;
  statInStock = 0;
  statLowStock = 0;
  statOutStock = 0;
  lowStockAlertCount = 0;

  // ── Quick Adjust panel ────────────────────────────
  qapBarcode = '';
  qapSuggestions: ProductSearchResult[] = [];
  qapShowSuggestions = false;
  qapSelectedProduct: ProductSearchResult | null = null;
  private qapInventories: Array<{ store_id: number; quantity: string | number }> = [];
  qapCurrentStock = 0;
  qapType: AdjustType = 'add';
  qapQty: number | null = null;
  qapNotes = '';
  qapSubmitting = false;
  private qapDebounce?: ReturnType<typeof setTimeout>;

  // ── Stock Movements tab ───────────────────────────
  movRows: StockMovement[] = [];
  movLoading = true;
  movPage = 1;
  movLimit = 20;
  movTotalPages = 1;
  movSearch = '';
  private movSearchDebounce?: ReturnType<typeof setTimeout>;

  // ── Stock Transfer tab ────────────────────────────
  stores: StoreRef[] = [];
  transferProducts: ProductSearchResult[] = [];
  transferDropdownsLoaded = false;
  trFromStore = '';
  trToStore = '';
  trProduct = '';
  trQty: number | null = null;
  trNotes = '';
  trSubmitting = false;

  transfers: StockMovement[] = [];
  transfersLoading = true;
  trPage = 1;
  trLimit = 10;
  trTotalPages = 1;

  // ── Product detail drawer ─────────────────────────
  viewOpen = false;
  viewLoading = false;
  viewData: ProductInventoryDetail | null = null;

  constructor(
    private inventoryService: InventoryService,
    private auth: AuthService,
    private notify: NotificationService,
  ) {}

  get activeStoreId(): number | null {
    return this.auth.activeStoreId;
  }

  ngOnInit(): void {
    this.loadStock(1);
    this.trFromStore = String(this.activeStoreId ?? '');
  }

  switchTab(tab: Tab): void {
    this.activeTab = tab;
    if (tab === 'movements') this.loadMovements(1);
    if (tab === 'transfer') this.loadTransferTab();
  }

  // ── Stock Status ──────────────────────────────────
  loadStock(page?: number): void {
    this.stockPage = page ?? this.stockPage;
    this.stockLoading = true;
    this.inventoryService
      .getStock({ store_id: this.activeStoreId ?? undefined, page: this.stockPage, limit: this.stockLimit, search: this.stockSearch || undefined })
      .subscribe({
        next: (res) => {
          this.stockRows = res.data;
          this.stockTotalPages = res.total_pages;
          this.stockLoading = false;
          this.loadStockStats(res.total);
        },
        error: () => {
          this.stockLoading = false;
          this.notify.error('Failed to load stock');
        },
      });
  }

  private loadStockStats(totalCount: number): void {
    this.inventoryService.getLowStock({ store_id: this.activeStoreId ?? undefined }).subscribe({
      next: (items) => {
        const outCount = items.filter((x) => parseFloat(String(x.quantity)) <= 0).length;
        const lowCount = items.filter((x) => {
          const qty = parseFloat(String(x.quantity));
          const min = parseFloat(String(x.Product?.alert_quantity || 0));
          return qty > 0 && qty <= min;
        }).length;
        this.statTotal = totalCount;
        this.statOutStock = outCount;
        this.statLowStock = lowCount;
        this.statInStock = Math.max(0, totalCount - outCount - lowCount);
        this.lowStockAlertCount = outCount + lowCount;
      },
      error: () => undefined,
    });
  }

  onStockSearchInput(value: string): void {
    this.stockSearch = value;
    clearTimeout(this.stockSearchDebounce);
    this.stockSearchDebounce = setTimeout(() => this.loadStock(1), 250);
  }

  onStockLimitChange(value: string): void {
    this.stockLimit = parseInt(value, 10);
    this.loadStock(1);
  }

  stockBadgeClass(row: InventoryRow): string {
    const qty = parseFloat(String(row.quantity)) || 0;
    const min = parseFloat(String(row.Product.alert_quantity || 0));
    if (qty < 0) return 'stk-backorder';
    if (qty <= 0) return 'stk-out';
    if (qty <= min) return 'stk-low';
    return 'stk-ok';
  }

  stockBadgeLabel(row: InventoryRow): string {
    const qty = parseFloat(String(row.quantity)) || 0;
    const min = parseFloat(String(row.Product.alert_quantity || 0));
    if (qty < 0) return `Backorder: ${qty}`;
    if (qty <= 0) return 'Out of Stock';
    if (qty <= min) return 'Low Stock';
    return 'In Stock';
  }

  selectRowForAdjustment(row: InventoryRow): void {
    this.inventoryService.getByProduct(row.product_id, this.activeStoreId).subscribe({
      next: (detail) => {
        this.qapSelectedProduct = { id: detail.product.id, name: detail.product.name, sku: row.Product.sku, barcode: row.Product.barcode };
        this.qapInventories = detail.inventories.map((i) => ({ store_id: i.store_id, quantity: i.quantity }));
        this.updateQapStock();
        this.qapShowSuggestions = false;
        this.qapBarcode = '';
      },
      error: () => this.notify.error('Could not load product'),
    });
  }

  // ── Quick Adjust panel ────────────────────────────
  setQapType(type: AdjustType): void {
    this.qapType = type;
  }

  private updateQapStock(): void {
    const inv = this.qapInventories.find((i) => i.store_id === this.activeStoreId);
    this.qapCurrentStock = inv ? parseFloat(String(inv.quantity)) || 0 : 0;
  }

  onQapBarcodeInput(value: string): void {
    this.qapBarcode = value;
    const val = value.trim();
    if (!val) {
      this.clearQapProduct();
      this.qapShowSuggestions = false;
      return;
    }
    clearTimeout(this.qapDebounce);
    this.qapDebounce = setTimeout(() => {
      this.inventoryService.searchProducts(val).subscribe({
        next: (list) => {
          if (!list.length) {
            this.qapShowSuggestions = false;
            return;
          }
          const exact = list.find((p) => p.barcode === val || p.sku === val);
          if (exact) {
            this.pickQapProduct(exact);
          } else {
            this.qapSuggestions = list;
            this.qapShowSuggestions = true;
          }
        },
        error: () => (this.qapShowSuggestions = false),
      });
    }, 250);
  }

  pickQapProduct(product: ProductSearchResult): void {
    this.inventoryService.getByProduct(product.id, this.activeStoreId).subscribe({
      next: (detail) => {
        this.qapSelectedProduct = product;
        this.qapInventories = detail.inventories.map((i) => ({ store_id: i.store_id, quantity: i.quantity }));
        this.updateQapStock();
        this.qapShowSuggestions = false;
        this.qapBarcode = '';
      },
      error: () => {
        this.qapSelectedProduct = product;
        this.qapInventories = [];
        this.updateQapStock();
        this.qapShowSuggestions = false;
        this.qapBarcode = '';
      },
    });
  }

  clearQapProduct(): void {
    this.qapSelectedProduct = null;
    this.qapInventories = [];
    this.qapCurrentStock = 0;
  }

  submitQuickAdjust(): void {
    if (!this.qapSelectedProduct) {
      this.notify.warning('Select a product first');
      return;
    }
    const rawQty = this.qapQty;
    if (!rawQty || isNaN(rawQty) || rawQty <= 0) {
      this.notify.warning('Enter a quantity greater than 0');
      return;
    }

    let quantityChange: number;
    let toastMsg: string;
    if (this.qapType === 'add') {
      quantityChange = rawQty;
      toastMsg = 'Stock added successfully';
    } else if (this.qapType === 'remove') {
      quantityChange = -rawQty;
      toastMsg = 'Stock deducted successfully';
    } else {
      quantityChange = rawQty - this.qapCurrentStock;
      if (quantityChange === 0) {
        this.notify.warning(`Stock is already at ${rawQty}. No change.`);
        return;
      }
      toastMsg = `Stock set to ${rawQty}`;
    }

    if (!this.activeStoreId) {
      this.notify.error('No active store selected');
      return;
    }

    this.qapSubmitting = true;
    this.inventoryService
      .adjust({
        product_id: this.qapSelectedProduct.id,
        store_id: this.activeStoreId,
        movement_type: 'adjustment',
        quantity_change: quantityChange,
        notes: this.qapNotes.trim() || null,
      })
      .subscribe({
        next: () => {
          this.qapSubmitting = false;
          this.notify.success(toastMsg);
          this.clearQapProduct();
          this.qapQty = null;
          this.qapNotes = '';
          this.loadStock(1);
        },
        error: (err) => {
          this.qapSubmitting = false;
          this.notify.error(err.error?.message || 'Adjustment failed');
        },
      });
  }

  // ── Product detail drawer ─────────────────────────
  openProductDrawer(productId: number): void {
    this.viewOpen = true;
    this.viewLoading = true;
    this.viewData = null;
    this.inventoryService.getByProduct(productId, this.activeStoreId).subscribe({
      next: (data) => {
        this.viewData = data;
        this.viewLoading = false;
      },
      error: () => {
        this.viewLoading = false;
        this.notify.error('Failed to load product details');
      },
    });
  }

  totalStock(): number {
    if (!this.viewData) return 0;
    return this.viewData.inventories.reduce((sum, i) => sum + (parseFloat(String(i.quantity)) || 0), 0);
  }

  closeViewDrawer(): void {
    this.viewOpen = false;
    this.viewData = null;
  }

  isExpired(dateStr: string | null): boolean {
    return !!dateStr && new Date(dateStr) < new Date();
  }

  // ── Stock Movements ───────────────────────────────
  loadMovements(page?: number): void {
    this.movPage = page ?? this.movPage;
    this.movLoading = true;
    this.inventoryService
      .getMovements({ store_id: this.activeStoreId ?? undefined, page: this.movPage, limit: this.movLimit, search: this.movSearch || undefined })
      .subscribe({
        next: (res) => {
          this.movRows = res.data;
          this.movTotalPages = res.total_pages;
          this.movLoading = false;
        },
        error: () => {
          this.movLoading = false;
          this.notify.error('Failed to load movements');
        },
      });
  }

  onMovSearchInput(value: string): void {
    this.movSearch = value;
    clearTimeout(this.movSearchDebounce);
    this.movSearchDebounce = setTimeout(() => this.loadMovements(1), 250);
  }

  onMovLimitChange(value: string): void {
    this.movLimit = parseInt(value, 10);
    this.loadMovements(1);
  }

  movementQtyDisplay(m: StockMovement): string {
    const qty = parseFloat(String(m.quantity_change)) || 0;
    return (qty >= 0 ? '+' : '') + qty;
  }

  movementRefDisplay(m: StockMovement): string {
    if (m.reference_type === 'purchase' && m.Purchase) return m.Purchase.purchase_number || String(m.reference_id ?? '—');
    return m.reference_id != null ? String(m.reference_id) : '—';
  }

  // ── Stock Transfer ────────────────────────────────
  loadTransferTab(): void {
    if (!this.transferDropdownsLoaded) {
      this.inventoryService.getActiveStores().subscribe({
        next: (stores) => {
          this.stores = stores;
          if (!this.trFromStore) this.trFromStore = String(this.activeStoreId ?? '');
        },
        error: () => this.notify.error('Failed to load stores'),
      });
      this.inventoryService.getAllActiveProducts().subscribe({
        next: (products) => (this.transferProducts = products),
        error: () => this.notify.error('Failed to load products'),
      });
      this.transferDropdownsLoaded = true;
    }
    this.loadRecentTransfers(1);
  }

  applyTransfer(): void {
    const fromStoreId = parseInt(this.trFromStore, 10);
    const toStoreId = parseInt(this.trToStore, 10);
    const productId = parseInt(this.trProduct, 10);
    const qty = this.trQty ? parseFloat(String(this.trQty)) : NaN;

    if (!fromStoreId) {
      this.notify.warning('Select source store');
      return;
    }
    if (!toStoreId) {
      this.notify.warning('Select destination store');
      return;
    }
    if (fromStoreId === toStoreId) {
      this.notify.warning('Source and destination stores must be different');
      return;
    }
    if (!productId) {
      this.notify.warning('Select a product');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      this.notify.warning('Enter a valid quantity');
      return;
    }

    this.trSubmitting = true;
    this.inventoryService
      .transfer({ product_id: productId, from_store_id: fromStoreId, to_store_id: toStoreId, quantity: qty, notes: this.trNotes.trim() || null })
      .subscribe({
        next: () => {
          this.trSubmitting = false;
          this.notify.success('Stock transferred successfully');
          this.trQty = null;
          this.trNotes = '';
          this.loadStock(1);
          this.loadRecentTransfers(1);
        },
        error: (err) => {
          this.trSubmitting = false;
          this.notify.error(err.error?.message || 'Transfer failed');
        },
      });
  }

  loadRecentTransfers(page?: number): void {
    this.trPage = page ?? this.trPage;
    this.transfersLoading = true;
    this.inventoryService
      .getMovements({ store_id: this.activeStoreId ?? undefined, movement_type: 'transfer', page: this.trPage, limit: this.trLimit })
      .subscribe({
        next: (res) => {
          this.transfers = res.data;
          this.trTotalPages = res.total_pages;
          this.transfersLoading = false;
        },
        error: () => (this.transfersLoading = false),
      });
  }

  transferIsOut(m: StockMovement): boolean {
    return (parseFloat(String(m.quantity_change)) || 0) < 0;
  }

  transferQtyAbs(m: StockMovement): number {
    return Math.abs(parseFloat(String(m.quantity_change)) || 0);
  }

  transferFromName(m: StockMovement): string {
    const isOut = this.transferIsOut(m);
    const thisStoreName = m.Store?.name || '—';
    const note = m.notes || '';
    const frmMatch = note.match(/^Transfer from ([^—]+)/i);
    return isOut ? thisStoreName : frmMatch ? frmMatch[1].trim() : '—';
  }

  transferToName(m: StockMovement): string {
    const isOut = this.transferIsOut(m);
    const thisStoreName = m.Store?.name || '—';
    const note = m.notes || '';
    const toMatch = note.match(/^Transfer to ([^—]+)/i);
    return isOut ? (toMatch ? toMatch[1].trim() : '—') : thisStoreName;
  }

  transferNote(m: StockMovement): string {
    const note = m.notes || '';
    return note.replace(/^Transfer (to|from)[^—]*—?\s*/i, '').trim() || '—';
  }
}
