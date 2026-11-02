import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductRef, VendorReturnEntry, WastageEntry } from '../../models/wastage-return.model';
import { WastageReturnsService } from '../../services/wastage-returns.service';

@Component({
  selector: 'app-wastage-return-list',
  standalone: false,
  templateUrl: './wastage-return-list.component.html',
  styleUrl: './wastage-return-list.component.css',
})
export class WastageReturnListComponent implements OnInit {
  mode: 'dead_stock' | 'vendor_return' = 'dead_stock';

  // Logs
  logs: (WastageEntry | VendorReturnEntry)[] = [];
  loading = false;
  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';

  // Quick form
  allProducts: ProductRef[] = [];
  vendorProducts: ProductRef[] = [];
  vendors: any[] = [];
  purchases: { id: number; purchase_number: string }[] = [];

  barcodeValue = '';
  selectedProduct: ProductRef | null = null;
  selectedVendorId: number | null = null;
  selectedPurchaseId: number | null = null;
  qty: number | null = null;
  reason = 'damaged';
  returnAction = 'refund';
  refNumber = '';
  notes = '';
  submitting = false;

  // Stock & cost
  activeStock = 0;
  activeCost = 0;

  // Searchable dropdown
  searchQuery = '';
  filteredProducts: ProductRef[] = [];
  searchProductFocused = false;
  searchHlIdx = -1;

  constructor(
    private service: WastageReturnsService,
    private notify: NotificationService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadVendors();
    this.loadInitialProducts();
    this.loadLogs();
  }

  // ── Load data ──
  loadInitialProducts(): void {
    if (this.mode === 'vendor_return') return;
    this.service.getProducts({ limit: 999, is_active: 1 }).subscribe({
      next: (p) => { this.allProducts = p; this.filterProducts(); },
    });
  }

  loadVendors(): void {
    this.service.getVendors({ limit: 999 }).subscribe({ next: (v) => { this.vendors = v; } });
  }

  loadLogs(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    const obs = this.mode === 'dead_stock'
      ? this.service.getWastages({ page: this.page, limit: this.limit, search: this.search || undefined })
      : this.service.getVendorReturns({ page: this.page, limit: this.limit, search: this.search || undefined });
    obs.subscribe({
      next: (res) => { this.logs = res.data; this.totalPages = res.total_pages; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  switchMode(m: 'dead_stock' | 'vendor_return'): void {
    this.mode = m;
    this.resetForm();
    if (m === 'dead_stock') this.loadInitialProducts();
    else { this.vendorProducts = []; this.searchQuery = ''; this.selectedProduct = null; }
    this.loadLogs(1);
  }

  // ── Form ──
  resetForm(): void {
    this.barcodeValue = '';
    this.selectedProduct = null;
    this.selectedVendorId = null;
    this.selectedPurchaseId = null;
    this.qty = null;
    this.reason = 'damaged';
    this.returnAction = 'refund';
    this.refNumber = '';
    this.notes = '';
    this.activeStock = 0;
    this.activeCost = 0;
    this.searchQuery = '';
    this.filteredProducts = [];
    this.searchHlIdx = -1;
  }

  // ── Barcode ──
  onBarcodeEnter(): void {
    const val = this.barcodeValue.trim();
    if (!val) return;
    this.service.scanBarcode(val).subscribe({
      next: (product) => {
        this.barcodeValue = '';
        if (!product?.id) { this.notify.warning('Not found'); return; }

        if (this.mode === 'dead_stock') {
          this.selectProductDirect(product);
        } else {
          if (product.last_vendor?.id) {
            this.selectedVendorId = product.last_vendor.id;
            this.onVendorChange(() => {
              this.selectProductDirect(product);
            });
          } else {
            this.notify.warning('No vendor history — select vendor manually');
          }
        }
        this.notify.success('Selected: ' + product.name);
      },
      error: () => { this.notify.warning('No product matched'); },
    });
  }

  // ── Product search SSD ──
  get productSource(): ProductRef[] {
    return this.mode === 'vendor_return' ? this.vendorProducts : this.allProducts;
  }

  filterProducts(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredProducts = !q
      ? this.productSource.slice(0, 80)
      : this.productSource.filter(
          (p) =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)),
        ).slice(0, 80);
  }

  selectProductFromDropdown(p: ProductRef): void {
    this.selectedProduct = p;
    this.searchQuery = p.name + (p.sku ? ' [' + p.sku + ']' : '');
    this.searchProductFocused = false;
    this.loadProductDetails(p.id);
  }

  selectProductDirect(p: any): void {
    this.selectedProduct = { id: p.id, name: p.name, sku: p.sku || '', purchase_price: p.purchase_price || 0 };
    this.searchQuery = p.name + (p.sku ? ' [' + p.sku + ']' : '');
    this.loadProductDetails(p.id);
  }

  loadProductDetails(pid: number): void {
    this.service.getProductDetails(pid).subscribe({
      next: (p) => { this.activeCost = p.purchase_price || 0; this.updatePreview(); },
    });
    this.service.getInventory(pid).subscribe({
      next: (res) => {
        const invs: any[] = res?.inventories || [];
        const inv = invs[0];
        this.activeStock = inv ? parseFloat(inv.quantity) : 0;
        this.updatePreview();
      },
    });
  }

  updatePreview(): void {
    // triggers template change detection
  }

  get estAmount(): number {
    return (this.qty || 0) * this.activeCost;
  }

  // ── Vendor mode ──
  onVendorChange(cb?: () => void): void {
    this.selectedProduct = null;
    this.searchQuery = '';
    this.filteredProducts = [];
    this.vendorProducts = [];
    this.purchases = [];
    this.selectedPurchaseId = null;
    this.activeStock = 0;
    this.activeCost = 0;

    if (!this.selectedVendorId) return;

    this.service.getVendorProducts(this.selectedVendorId).subscribe({
      next: (prods) => {
        this.vendorProducts = prods;
        this.service.getPurchases({ vendor_id: this.selectedVendorId, limit: 50 }).subscribe({
          next: (purs) => { this.purchases = purs; if (cb) cb(); },
        });
        if (cb) cb();
      },
    });
  }

  // ── Submit ──
  submitForm(): void {
    if (!this.selectedProduct?.id || !this.qty || this.qty <= 0) {
      this.notify.warning('Select a product and enter qty');
      return;
    }
    if (this.mode === 'vendor_return' && !this.selectedVendorId) {
      this.notify.warning('Select a vendor');
      return;
    }

    this.submitting = true;
    const payload: any = {
      product_id: this.selectedProduct.id,
      store_id: this.auth.activeStoreId ?? undefined,
      quantity: this.qty,
      reason: this.reason,
      notes: this.notes.trim() || undefined,
      reference_number: this.refNumber.trim() || undefined,
    };

    const obs = this.mode === 'dead_stock'
      ? this.service.recordWastage(payload)
      : this.service.recordVendorReturn({
          ...payload,
          vendor_id: this.selectedVendorId,
          purchase_id: this.selectedPurchaseId || null,
          return_action: this.returnAction,
          refund_amount: this.estAmount,
        });

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.notify.success('Saved successfully');
        this.resetForm();
        this.loadLogs(1);
      },
      error: (err) => { this.submitting = false; this.notify.error(err.error?.message || 'Failed to save'); },
    });
  }

  getVendorName(m: any): string { return m.Vendor?.name || '—'; }
  getReturnAction(m: any): string { return m.return_action || '—'; }
  onProductSearchBlur(): void { setTimeout(() => this.searchProductFocused = false, 180); }

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ', ' +
           d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
}
