import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Category } from '../../../categories/models/category.model';
import { ProductsService } from '../../../products/services/products.service';
import { Product } from '../../../products/models/product.model';
import { Discount, DiscountType, DiscountListParams } from '../../models/discount.model';
import { DiscountsService } from '../../services/discounts.service';

type View = 'discounts' | 'offers';
type PickerKey = 'bogoGet' | 'freeItem' | 'members';
type DrawerMode = 'form' | 'view' | null;

const OFFER_TYPES: DiscountType[] = ['bogo', 'min_qty', 'bundle', 'free_item'];
const DISCOUNT_TYPES: DiscountType[] = ['percent', 'flat', 'bulk', 'spend_get', 'category'];

const TYPE_LABELS: Record<DiscountType, string> = {
  percent: 'Percent %',
  flat: 'Flat ₹',
  bogo: 'Buy X Get Y',
  bulk: 'Bulk / Qty Tiers',
  min_qty: 'Min Qty',
  spend_get: 'Spend & Get',
  category: 'Category',
  bundle: 'Bundle',
  free_item: 'Free Item',
};
const TYPE_COLORS: Record<DiscountType, { bg: string; color: string; border: string }> = {
  percent: { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  flat: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  bogo: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  bulk: { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  min_qty: { bg: '#fdf4ff', color: '#6b21a8', border: '#e9d5ff' },
  spend_get: { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
  category: { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
  bundle: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  free_item: { bg: '#fce7f3', color: '#831843', border: '#fbcfe8' },
};

@Component({
  selector: 'app-discount-list',
  standalone: false,
  templateUrl: './discount-list.component.html',
  styleUrl: './discount-list.component.css',
})
export class DiscountListComponent implements OnInit {
  view: View = 'discounts';
  rows: Discount[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  typeFilter = '';
  statusFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  categories: Category[] = [];

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;
  viewingDiscount: Discount | null = null;

  // ── Product mini search-selects (bogo_get_product_id / free_product_id / assigned products) ──
  productPickers: Record<PickerKey, { query: string; results: Product[]; open: boolean; selectedId: number | null; selectedName: string }> = {
    bogoGet: { query: '', results: [], open: false, selectedId: null, selectedName: '' },
    freeItem: { query: '', results: [], open: false, selectedId: null, selectedName: '' },
    members: { query: '', results: [], open: false, selectedId: null, selectedName: '' },
  };
  /** BOGO "buy" products / bundle members (saved as offer_product_ids) */
  offerProducts: { id: number; name: string }[] = [];
  private pickerDebounce: Record<string, ReturnType<typeof setTimeout>> = {};

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private discountsService: DiscountsService,
    private categoriesService: CategoriesService,
    private productsService: ProductsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      description: [''],
      discount_type: ['percent' as DiscountType, Validators.required],
      discount_value: [0],
      discount_value_type: ['percent'],
      min_order_amount: [0],
      max_discount_amount: [null],
      apply_to: ['all'],
      category_id: [null],
      customer_group: ['all'],
      usage_limit: [null],
      per_customer_limit: [null],
      start_date: [''],
      end_date: [''],
      bogo_buy_qty: [1],
      bogo_get_qty: [1],
      bogo_max_times: [0],
      min_qty: [1],
      tax_handling: ['before_discount'],
      single_use_per_bill: [false],
      is_active: [1],
      // Website → Offers (blank text = wording built from the discount)
      show_on_website: [true],
      web_title: [''],
      web_highlight: [''],
      web_note: [''],
      web_badge: [''],
      web_icon: ['bi-tag'],
      web_sort_order: [0],
    });
  }

  ngOnInit(): void {
    this.categoriesService.getAllFlat().subscribe({ next: (rows) => (this.categories = rows), error: () => undefined });
    this.updateTypeFilterOptions();
    this.load(1);
  }

  get typeFilterOptions(): Array<{ value: string; label: string }> {
    return this.view === 'offers'
      ? [
          { value: '', label: 'All Offer Types ▾' },
          { value: 'bogo', label: 'Buy X Get Y' },
          { value: 'min_qty', label: 'Min Qty' },
          { value: 'bundle', label: 'Bundle' },
          { value: 'free_item', label: 'Free Item' },
        ]
      : [
          { value: '', label: 'All Types ▾' },
          { value: 'percent', label: 'Percent %' },
          { value: 'flat', label: 'Flat ₹' },
          { value: 'bulk', label: 'Bulk / Qty Tiers' },
          { value: 'spend_get', label: 'Spend & Get' },
          { value: 'category', label: 'Category' },
        ];
  }

  private updateTypeFilterOptions(): void {
    this.typeFilter = '';
  }

  switchView(v: View): void {
    this.view = v;
    this.updateTypeFilterOptions();
    this.load(1);
  }

  get addLabel(): string {
    return this.view === 'offers' ? 'Add Offer' : 'Add Discount';
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    const isExpiredFilter = this.statusFilter === 'expired';
    const params: DiscountListParams = {
      page: isExpiredFilter ? 1 : this.page,
      limit: isExpiredFilter ? 500 : this.limit,
      search: this.search || undefined,
      is_active: this.statusFilter === 'active' ? '1' : this.statusFilter === 'inactive' ? '0' : undefined,
      // Filter by type family on the server so page counts match what is shown
      discount_type: this.typeFilter || (this.view === 'offers' ? OFFER_TYPES : DISCOUNT_TYPES).join(','),
    };
    this.discountsService.getAll(params).subscribe({
      next: (res) => {
        let rows = res.data;
        if (isExpiredFilter) {
          rows = rows.filter((r) => this.isExpired(r));
          this.totalPages = 1;
        } else {
          this.totalPages = res.total_pages;
        }
        this.rows = rows;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load discounts';
        this.loading = false;
      },
    });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  onFilterChange(): void {
    this.load(1);
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  // ── Display helpers ────────────────────────────────────────
  isExpired(item: Discount): boolean {
    return !!item.end_date && new Date(item.end_date) < new Date();
  }

  statusBadgeClass(item: Discount): string {
    if (this.isExpired(item)) return 'badge-cancelled';
    return item.is_active ? 'badge-active' : 'badge-inactive';
  }

  statusBadgeLabel(item: Discount): string {
    if (this.isExpired(item)) return 'Expired';
    return item.is_active ? 'Active' : 'Inactive';
  }

  typeLabel(t: DiscountType): string {
    return TYPE_LABELS[t] || t;
  }

  typeColor(t: DiscountType) {
    return TYPE_COLORS[t] || { bg: '#f6e7e9', color: '#2a1a20', border: '#efd6da' };
  }

  formatCurrency(n: number | string | null): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  }

  formatDate(s: string | null): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  customerGroupLabel(g: string): string {
    return ({ member: 'Members only', vip: 'VIP only', wholesale: 'Wholesale only' } as Record<string, string>)[g] || g;
  }

  scopeLabel(item: Discount): string {
    switch (item.discount_type) {
      case 'category':
        return item.category_name ? 'Cat: ' + item.category_name : 'Category';
      case 'bogo':
        return item.offer_products?.length ? this.offerProductNames(item) : 'Any product';
      case 'bundle':
        return item.offer_products?.length ? 'Bundle: ' + this.offerProductNames(item) : 'Bundle (no products)';
      case 'min_qty':
        return 'Min qty: ' + (item.min_qty || 1) + (item.offer_products?.length ? ' of ' + this.offerProductNames(item) : '');
      case 'spend_get':
        return 'Spend ' + this.formatCurrency(item.min_order_amount) + (item.offer_products?.length ? ' on ' + this.offerProductNames(item) : '');
      case 'free_item':
        return 'Free product';
      default:
        if (item.target?.type === 'product') return 'Product: ' + (item.target.name || '#' + item.target.id);
        if (item.target?.type === 'products') return 'Products: ' + this.offerProductNames(item);
        if (item.target?.type === 'category') return 'Category: ' + (item.target.name || '#' + item.target.id);
        return 'Order level';
    }
  }

  private offerProductNames(item: Discount): string {
    return (item.offer_products || []).map((op) => op.product?.name || '#' + op.product_id).join(', ');
  }

  valueDisplay(item: Discount): string {
    const productName = (id: number | null, name?: string | null) => (id ? name || `Product #${id}` : '');
    switch (item.discount_type) {
      case 'bogo':
        return `Buy ${item.bogo_buy_qty || 1} Get ${item.bogo_get_qty || 1} Free` + (item.bogo_get_product_id ? ` (${productName(item.bogo_get_product_id, item.bogo_get_product_name)})` : '');
      case 'free_item':
        return `Spend ${this.formatCurrency(item.min_order_amount)} → Free` + (item.free_product_id ? `: ${productName(item.free_product_id, item.free_product_name)}` : ' product');
      case 'spend_get':
        return `Spend ${this.formatCurrency(item.min_order_amount)} → ` + (item.discount_value_type === 'percent' ? `${item.discount_value}% off` : `${this.formatCurrency(item.discount_value)} off`);
      case 'min_qty':
        return `Buy ≥ ${item.min_qty || 1} → ` + (item.discount_value_type === 'percent' ? `${item.discount_value}% off` : `${this.formatCurrency(item.discount_value)} off`);
      case 'percent':
        return `${item.discount_value || 0}% off`;
      case 'flat':
        return `${this.formatCurrency(item.discount_value)} off`;
      case 'category':
        return (item.discount_value_type === 'percent' ? `${item.discount_value}%` : this.formatCurrency(item.discount_value)) + ' off category';
      case 'bundle':
        return (item.discount_value_type === 'percent' ? `${item.discount_value}%` : this.formatCurrency(item.discount_value)) + ' off bundle';
      case 'bulk': {
        const tiers = item.tiers || [];
        return tiers.length ? `${tiers.length} qty tier${tiers.length > 1 ? 's' : ''}` : 'Qty tiers (0 configured)';
      }
      default:
        return String(item.discount_value ?? '—');
    }
  }

  // ── Type-conditional form sections ─────────────────────────
  get selectedType(): DiscountType {
    return this.form.value.discount_type as DiscountType;
  }

  showValueSection(): boolean {
    return ['percent', 'flat', 'category', 'bundle', 'min_qty', 'spend_get'].includes(this.selectedType);
  }
  showBogoSection(): boolean {
    return this.selectedType === 'bogo';
  }
  showMinQtySection(): boolean {
    return this.selectedType === 'min_qty';
  }
  showSpendSection(): boolean {
    return this.selectedType === 'spend_get';
  }
  showCategorySection(): boolean {
    return this.selectedType === 'category';
  }
  showApplyToSection(): boolean {
    return ['percent', 'flat'].includes(this.selectedType);
  }
  showBundleSection(): boolean {
    return this.selectedType === 'bundle';
  }

  // ── Assigned products (offer_product_ids) ───────────────────
  /** Types that can be limited to chosen products. */
  showProductsSection(): boolean {
    const t = this.selectedType;
    if (t === 'percent' || t === 'flat') return this.form.value.apply_to === 'product';
    return ['bogo', 'bundle', 'min_qty', 'spend_get'].includes(t);
  }

  get productsRequired(): boolean {
    return this.selectedType === 'bundle' || ['percent', 'flat'].includes(this.selectedType);
  }

  get productsLabel(): string {
    switch (this.selectedType) {
      case 'bogo': return 'Buy Products';
      case 'bundle': return 'Bundle Products';
      case 'min_qty':
      case 'spend_get': return 'Only These Products';
      default: return 'Discounted Products';
    }
  }

  get productsHint(): string {
    switch (this.selectedType) {
      case 'bogo': return 'Buying these gets the free item. Leave empty for any product.';
      case 'bundle': return 'All of these must be in the cart (at least 2).';
      case 'min_qty': return 'Only these count towards the quantity and get the discount. Leave empty for the whole cart.';
      case 'spend_get': return 'Only spend on these counts. Leave empty for the whole cart.';
      default: return 'The discount applies to each of these products.';
    }
  }
  showFreeItemSection(): boolean {
    return this.selectedType === 'free_item';
  }
  showValueTypeToggle(): boolean {
    return ['category', 'bundle', 'min_qty', 'spend_get'].includes(this.selectedType);
  }

  // ── Product mini search-selects ─────────────────────────────
  onPickerInput(key: PickerKey, value: string): void {
    this.productPickers[key].query = value;
    this.productPickers[key].selectedId = null;
    clearTimeout(this.pickerDebounce[key]);
    if (!value.trim()) {
      this.productPickers[key].results = [];
      this.productPickers[key].open = false;
      return;
    }
    this.pickerDebounce[key] = setTimeout(() => {
      this.productsService.getAll({ search: value, limit: 8, is_active: '1' }).subscribe({
        next: (res) => {
          this.productPickers[key].results = res.data;
          this.productPickers[key].open = res.data.length > 0;
        },
        error: () => undefined,
      });
    }, 200);
  }

  pickProduct(key: PickerKey, product: Product): void {
    if (key === 'members') {
      if (!this.offerProducts.some((p) => p.id === product.id)) this.offerProducts = [...this.offerProducts, { id: product.id, name: product.name }];
      this.clearPicker('members');
      return;
    }
    this.productPickers[key] = { query: product.name, results: [], open: false, selectedId: product.id, selectedName: product.name };
  }

  removeOfferProduct(id: number): void {
    this.offerProducts = this.offerProducts.filter((p) => p.id !== id);
  }

  clearPicker(key: PickerKey): void {
    this.productPickers[key] = { query: '', results: [], open: false, selectedId: null, selectedName: '' };
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    const defaultType: DiscountType = this.view === 'offers' ? 'bogo' : 'percent';
    this.form.reset({
      name: '', code: '', description: '', discount_type: defaultType, discount_value: 0, discount_value_type: 'percent',
      min_order_amount: 0, max_discount_amount: null, apply_to: 'all', category_id: null, customer_group: 'all',
      usage_limit: null, per_customer_limit: null, start_date: '', end_date: '',
      bogo_buy_qty: 1, bogo_get_qty: 1, bogo_max_times: 0, min_qty: 1,
      tax_handling: 'before_discount', single_use_per_bill: false, is_active: 1,
      show_on_website: true, web_title: '', web_highlight: '', web_note: '', web_badge: '', web_icon: 'bi-tag', web_sort_order: 0,
    });
    this.clearPicker('bogoGet');
    this.clearPicker('freeItem');
    this.clearPicker('members');
    this.offerProducts = [];
    this.drawerMode = 'form';
  }

  openEdit(item: Discount): void {
    this.discountsService.getById(item.id).subscribe({
      next: (d) => {
        this.editId = d.id;
        this.form.reset({
          name: d.name,
          code: d.code || '',
          description: d.description || '',
          discount_type: d.discount_type,
          discount_value: parseFloat(String(d.discount_value)) || 0,
          discount_value_type: d.discount_value_type || 'percent',
          min_order_amount: parseFloat(String(d.min_order_amount)) || 0,
          max_discount_amount: d.max_discount_amount,
          apply_to: d.apply_to || 'all',
          // Percent/flat keep their category in apply_to_id; category-type discounts in category_id
          category_id: d.discount_type !== 'category' && d.apply_to === 'category' ? d.apply_to_id : d.category_id,
          customer_group: d.customer_group || 'all',
          usage_limit: d.usage_limit,
          per_customer_limit: d.per_customer_limit,
          start_date: d.start_date ? d.start_date.slice(0, 10) : '',
          end_date: d.end_date ? d.end_date.slice(0, 10) : '',
          bogo_buy_qty: d.bogo_buy_qty || 1,
          bogo_get_qty: d.bogo_get_qty || 1,
          bogo_max_times: d.bogo_max_times || 0,
          min_qty: d.min_qty || 1,
          tax_handling: d.tax_handling || 'before_discount',
          single_use_per_bill: !!d.single_use_per_bill,
          is_active: d.is_active,
          show_on_website: d.show_on_website !== 0,
          web_title: d.web_title || '',
          web_highlight: d.web_highlight || '',
          web_note: d.web_note || '',
          web_badge: d.web_badge || '',
          web_icon: d.web_icon || 'bi-tag',
          web_sort_order: d.web_sort_order || 0,
        });
        this.clearPicker('bogoGet');
        this.clearPicker('freeItem');
        this.clearPicker('members');
        const picked = (id: number, name?: string | null) => ({ query: name || `Product #${id}`, results: [] as Product[], open: false, selectedId: id, selectedName: name || '' });
        if (d.bogo_get_product_id) this.productPickers.bogoGet = picked(d.bogo_get_product_id, d.bogo_get_product_name);
        if (d.free_product_id) this.productPickers.freeItem = picked(d.free_product_id, d.free_product_name);
        this.offerProducts = (d.offer_products || []).map((op) => ({ id: op.product_id, name: op.product?.name || `Product #${op.product_id}` }));
        // Older discounts kept their one product in apply_to_id only
        if (d.apply_to === 'product' && d.apply_to_id && !this.offerProducts.some((p) => p.id === d.apply_to_id)) {
          this.offerProducts.unshift({ id: d.apply_to_id, name: (d.target?.type === 'product' && d.target.name) || `Product #${d.apply_to_id}` });
        }
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load discount'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return `${this.viewingDiscount?.name ?? ''}`;
    if (this.editId) return this.view === 'offers' ? 'Edit Offer' : 'Edit Discount';
    return this.view === 'offers' ? 'Add Offer' : 'Add Discount';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    if (!name) {
      this.notify.warning('Name is required');
      return;
    }

    const type = raw.discount_type as DiscountType;
    const payload: Partial<Discount> = {
      name,
      code: raw.code?.trim() || null,
      description: raw.description?.trim() || null,
      discount_type: type,
      discount_value: parseFloat(raw.discount_value) || 0,
      discount_value_type: raw.discount_value_type,
      min_order_amount: parseFloat(raw.min_order_amount) || 0,
      max_discount_amount: raw.max_discount_amount !== null && raw.max_discount_amount !== '' ? parseFloat(raw.max_discount_amount) : null,
      customer_group: raw.customer_group,
      usage_limit: raw.usage_limit !== null && raw.usage_limit !== '' ? parseInt(raw.usage_limit, 10) : null,
      per_customer_limit: raw.per_customer_limit !== null && raw.per_customer_limit !== '' ? parseInt(raw.per_customer_limit, 10) : null,
      start_date: raw.start_date || null,
      end_date: raw.end_date || null,
      tax_handling: raw.tax_handling,
      single_use_per_bill: raw.single_use_per_bill ? 1 : 0,
      is_active: parseInt(raw.is_active, 10),
      show_on_website: raw.show_on_website ? 1 : 0,
      web_title: raw.web_title?.trim() || null,
      web_highlight: raw.web_highlight?.trim() || null,
      web_note: raw.web_note?.trim() || null,
      web_badge: raw.web_badge?.trim() || null,
      web_icon: raw.web_icon?.trim() || null,
      web_sort_order: parseInt(raw.web_sort_order, 10) || 0,
    } as Partial<Discount>;

    if (this.showApplyToSection()) {
      payload.apply_to = raw.apply_to;
      // Products: the first also goes in apply_to_id for older readers (POS); all are in offer_products
      payload.apply_to_id = raw.apply_to === 'category' ? (raw.category_id ? Number(raw.category_id) : null) : raw.apply_to === 'product' ? this.offerProducts[0]?.id ?? null : null;
      if (raw.apply_to !== 'all' && !payload.apply_to_id) {
        this.notify.warning(raw.apply_to === 'category' ? 'Choose the category' : 'Add at least one product');
        return;
      }
    }
    if (type === 'bundle' && this.offerProducts.length < 2) {
      this.notify.warning('A bundle needs at least 2 products');
      return;
    }
    // Always sent, so switching type or scope clears products that no longer apply
    payload.offer_product_ids = this.showProductsSection() ? this.offerProducts.map((p) => p.id) : [];
    if (type === 'category') {
      payload.category_id = raw.category_id ? Number(raw.category_id) : null;
    }
    if (type === 'bogo') {
      payload.bogo_buy_qty = parseInt(raw.bogo_buy_qty, 10) || 1;
      payload.bogo_get_qty = parseInt(raw.bogo_get_qty, 10) || 1;
      payload.bogo_max_times = parseInt(raw.bogo_max_times, 10) || 0;
      payload.bogo_get_product_id = this.productPickers.bogoGet.selectedId;
    }
    if (type === 'min_qty') {
      payload.min_qty = parseInt(raw.min_qty, 10) || 1;
    }
    if (type === 'free_item') {
      payload.free_product_id = this.productPickers.freeItem.selectedId;
    }

    this.saving = true;
    const isOffer = OFFER_TYPES.includes(type);
    const label = isOffer ? 'Offer' : 'Discount';
    const request$ = this.editId ? this.discountsService.update(this.editId, payload) : this.discountsService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? `${label} updated` : `${label} created — listed under ${isOffer ? 'Product Offers' : 'Discounts'}`);
        this.closeDrawer();
        this.load(1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || err.error?.errors?.join(', ') || 'Save failed');
      },
    });
  }

  // ── View (offers only) ──────────────────────────────────────
  openView(item: Discount): void {
    this.discountsService.getById(item.id).subscribe({
      next: (d) => {
        this.viewingDiscount = d;
        this.drawerMode = 'view';
      },
      error: () => this.notify.error('Could not load discount'),
    });
  }

  // ── Reset usage ──────────────────────────────────────────────
  resetUsage(item: Discount): void {
    this.discountsService.resetUsage(item.id).subscribe({
      next: () => {
        this.notify.success('Usage count reset to 0');
        this.load();
      },
      error: () => this.notify.error('Failed to reset usage'),
    });
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(item: Discount): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: this.view === 'offers' ? 'Delete Offer' : 'Delete Discount',
      message: `Delete "${item.name}"?`,
      note: 'This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.discountsService.remove(item.id).subscribe({
      next: () => {
        this.notify.success('Deleted');
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingDiscount = null;
    this.editId = null;
  }
}
