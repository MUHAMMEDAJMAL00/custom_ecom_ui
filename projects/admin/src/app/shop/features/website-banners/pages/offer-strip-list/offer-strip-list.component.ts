import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Category } from '../../../categories/models/category.model';
import { ProductsService } from '../../../products/services/products.service';
import { Product } from '../../../products/models/product.model';
import { Discount, DiscountType } from '../../../discounts/models/discount.model';
import { DiscountsService } from '../../../discounts/services/discounts.service';

type DrawerMode = 'form' | 'view' | null;

/** Types this page can edit in full; other types keep their rules in Discounts. */
const SIMPLE_TYPES: DiscountType[] = ['percent', 'flat'];

const TYPE_LABELS: Record<DiscountType, string> = {
  percent: 'Percent %', flat: 'Flat ₹', bogo: 'Buy X Get Y', bulk: 'Bulk / Qty Tiers', min_qty: 'Min Qty',
  spend_get: 'Spend & Get', category: 'Category', bundle: 'Bundle', free_item: 'Free Item',
};

/**
 * Website → Offers. The same rows as Finance → Discounts: every discount is listed
 * here, and "Show on website" decides whether the storefront shows it (while it is
 * active and inside its dates). Creating, editing, (de)activating or deleting here
 * changes the discount itself.
 */
@Component({
  selector: 'app-offer-strip-list',
  standalone: false,
  templateUrl: './offer-strip-list.component.html',
  styleUrl: './offer-strip-list.component.css',
})
export class OfferStripListComponent implements OnInit {
  rows: Discount[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '';
  websiteFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  categories: Category[] = [];

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  /** Type of the discount being edited (rules of non-simple types are edited in Discounts) */
  editType: DiscountType = 'percent';
  /** Edited offer has several products: those are managed in Finance → Discounts */
  editHasProductList = false;
  saving = false;
  viewing: Discount | null = null;

  productQuery = '';
  productResults: Product[] = [];
  productOpen = false;
  selectedProduct: { id: number; name: string } | null = null;
  private productDebounce?: ReturnType<typeof setTimeout>;

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
      discount_type: ['percent' as DiscountType],
      discount_value: [10],
      min_order_amount: [0],
      apply_to: ['all'],
      category_id: [null as number | null],
      start_date: [''],
      end_date: [''],
      is_active: [1],
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
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.discountsService
      .getAll({
        page: this.page,
        limit: this.limit,
        search: this.search || undefined,
        is_active: this.statusFilter || undefined,
        show_on_website: this.websiteFilter || undefined,
        sort: 'website',
      })
      .subscribe({
        next: (res) => {
          this.rows = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load offers.';
          this.loading = false;
        },
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  // ── Display ──────────────────────────────────────────────────
  typeLabel(t: DiscountType): string {
    return TYPE_LABELS[t] || t;
  }

  isSimple(t: DiscountType): boolean {
    return SIMPLE_TYPES.includes(t);
  }

  isExpired(d: Discount): boolean {
    return !!d.end_date && new Date(d.end_date) < new Date();
  }

  isUpcoming(d: Discount): boolean {
    return !!d.start_date && new Date(d.start_date) > new Date();
  }

  /** What shoppers see right now. */
  websiteState(d: Discount): { label: string; cls: string } {
    if (!d.show_on_website) return { label: 'Hidden', cls: 'badge-inactive' };
    if (!d.is_active) return { label: 'Hidden (inactive)', cls: 'badge-inactive' };
    if (this.isExpired(d)) return { label: 'Hidden (expired)', cls: 'badge-cancelled' };
    if (this.isUpcoming(d)) return { label: 'Scheduled', cls: 'badge-pending' };
    if (d.usage_limit != null && d.usage_count >= d.usage_limit) return { label: 'Hidden (used up)', cls: 'badge-cancelled' };
    return { label: 'Live', cls: 'badge-active' };
  }

  valueLabel(d: Discount): string {
    const v = Number(d.discount_value || 0);
    const money = (n: number | string) => '₹' + Number(n || 0).toLocaleString('en-IN');
    switch (d.discount_type) {
      case 'percent': return `${v}% off`;
      case 'flat': return `${money(v)} off`;
      case 'bogo': return `Buy ${d.bogo_buy_qty || 1} Get ${d.bogo_get_qty || 1}`;
      case 'free_item': return `Free: ${d.free_product_name || 'product'}`;
      default: return d.discount_value_type === 'flat' ? `${money(v)} off` : `${v}% off`;
    }
  }

  appliesTo(d: Discount): string {
    if (d.offer_products?.length) return d.offer_products.map((op) => op.product?.name || '#' + op.product_id).join(', ');
    if (d.target?.type === 'product') return 'Product: ' + (d.target.name || '#' + d.target.id);
    if (d.target?.type === 'products') return d.target.products.map((p) => p.name || '#' + p.id).join(', ');
    if (d.target?.type === 'category') return 'Category: ' + (d.target.name || '#' + d.target.id);
    return 'All products';
  }

  /** Text the storefront shows (blank website fields fall back like the server does). */
  previewTitle(d: { web_title?: string | null; discount_type: DiscountType; discount_value: number | string; discount_value_type?: string }): string {
    if (d.web_title) return d.web_title;
    const v = Number(d.discount_value || 0);
    return d.discount_type === 'flat' || d.discount_value_type === 'flat' ? `₹${v} OFF` : `${v}% OFF`;
  }

  previewHighlight(d: Discount): string {
    if (d.web_highlight) return d.web_highlight;
    if (d.code) return `Code: ${d.code}`;
    if ((d.target?.type === 'product' || d.target?.type === 'category') && d.target.name) return `On ${d.target.name}`;
    if (d.target?.type === 'products') return 'On selected products';
    return 'Applied automatically';
  }

  // ── Quick toggles (same discount row as Finance → Discounts) ──
  toggleWebsite(d: Discount): void {
    this.patch(d, { show_on_website: d.show_on_website ? 0 : 1 }, d.show_on_website ? 'Hidden from website' : 'Shown on website');
  }

  toggleActive(d: Discount): void {
    this.patch(d, { is_active: d.is_active ? 0 : 1 }, d.is_active ? 'Offer deactivated' : 'Offer activated');
  }

  private patch(d: Discount, changes: Partial<Discount>, message: string): void {
    this.discountsService.update(d.id, changes).subscribe({
      next: () => {
        this.notify.success(message);
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Update failed'),
    });
  }

  // ── Product picker (apply to one product) ─────────────────────
  onProductInput(value: string): void {
    this.productQuery = value;
    this.selectedProduct = null;
    clearTimeout(this.productDebounce);
    if (!value.trim()) {
      this.productResults = [];
      this.productOpen = false;
      return;
    }
    this.productDebounce = setTimeout(() => {
      this.productsService.getAll({ search: value, limit: 8, is_active: '1' }).subscribe({
        next: (res) => {
          this.productResults = res.data;
          this.productOpen = res.data.length > 0;
        },
        error: () => undefined,
      });
    }, 200);
  }

  pickProduct(p: Product): void {
    this.selectedProduct = { id: p.id, name: p.name };
    this.productQuery = p.name;
    this.productResults = [];
    this.productOpen = false;
  }

  clearProduct(): void {
    this.selectedProduct = null;
    this.productQuery = '';
    this.productResults = [];
    this.productOpen = false;
  }

  // ── Add / Edit ─────────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.editType = 'percent';
    this.editHasProductList = false;
    this.form.reset({
      name: '', code: '', discount_type: 'percent', discount_value: 10, min_order_amount: 0,
      apply_to: 'all', category_id: null, start_date: '', end_date: '', is_active: 1,
      show_on_website: true, web_title: '', web_highlight: '', web_note: '', web_badge: '', web_icon: 'bi-tag',
      web_sort_order: this.rows.length,
    });
    this.selectedProduct = null;
    this.productQuery = '';
    this.drawerMode = 'form';
  }

  openEdit(item: Discount): void {
    this.discountsService.getById(item.id).subscribe({
      next: (d) => {
        this.editId = d.id;
        this.editType = d.discount_type;
        this.editHasProductList = d.target?.type === 'products';
        this.form.reset({
          name: d.name,
          code: d.code || '',
          discount_type: d.discount_type,
          discount_value: parseFloat(String(d.discount_value)) || 0,
          min_order_amount: parseFloat(String(d.min_order_amount)) || 0,
          apply_to: d.apply_to || 'all',
          category_id: d.apply_to === 'category' ? d.apply_to_id : null,
          start_date: d.start_date ? d.start_date.slice(0, 10) : '',
          end_date: d.end_date ? d.end_date.slice(0, 10) : '',
          is_active: d.is_active,
          show_on_website: d.show_on_website !== 0,
          web_title: d.web_title || '',
          web_highlight: d.web_highlight || '',
          web_note: d.web_note || '',
          web_badge: d.web_badge || '',
          web_icon: d.web_icon || 'bi-tag',
          web_sort_order: d.web_sort_order || 0,
        });
        this.selectedProduct = d.target?.type === 'product' ? { id: d.target.id, name: d.target.name || `Product #${d.target.id}` } : null;
        this.productQuery = this.selectedProduct?.name || '';
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load offer'),
    });
  }

  openView(item: Discount): void {
    this.viewing = item;
    this.drawerMode = 'view';
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return this.viewing?.name || 'Offer';
    return this.editId ? 'Edit Offer' : 'Add Offer';
  }

  get canEditRules(): boolean {
    return this.isSimple(this.editType) && !this.editHasProductList;
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    if (!name) {
      this.notify.warning('Name is required');
      return;
    }

    const payload: Partial<Discount> = {
      name,
      code: raw.code?.trim().toUpperCase() || null,
      is_active: parseInt(raw.is_active, 10),
      start_date: raw.start_date || null,
      end_date: raw.end_date || null,
      show_on_website: raw.show_on_website ? 1 : 0,
      web_title: raw.web_title?.trim() || null,
      web_highlight: raw.web_highlight?.trim() || null,
      web_note: raw.web_note?.trim() || null,
      web_badge: raw.web_badge?.trim() || null,
      web_icon: raw.web_icon?.trim() || null,
      web_sort_order: parseInt(raw.web_sort_order, 10) || 0,
    };

    // Rules of percent/flat offers are edited here too; other types only in Discounts
    if (this.canEditRules) {
      const value = parseFloat(raw.discount_value) || 0;
      if (value <= 0) {
        this.notify.warning('Enter the discount value');
        return;
      }
      if (raw.discount_type === 'percent' && value > 100) {
        this.notify.warning('A percent discount cannot be more than 100%');
        return;
      }
      payload.discount_type = raw.discount_type;
      payload.discount_value = value;
      payload.min_order_amount = parseFloat(raw.min_order_amount) || 0;
      payload.apply_to = raw.apply_to;
      payload.apply_to_id = raw.apply_to === 'category' ? (raw.category_id ? Number(raw.category_id) : null)
        : raw.apply_to === 'product' ? this.selectedProduct?.id ?? null : null;
      if (raw.apply_to !== 'all' && !payload.apply_to_id) {
        this.notify.warning(raw.apply_to === 'category' ? 'Choose the category' : 'Choose the product');
        return;
      }
      // One product here; several products are assigned in Finance → Discounts
      payload.offer_product_ids = raw.apply_to === 'product' && payload.apply_to_id ? [payload.apply_to_id] : [];
    }

    this.saving = true;
    const request$ = this.editId ? this.discountsService.update(this.editId, payload) : this.discountsService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Offer updated' : 'Offer created — also listed in Finance → Discounts');
        this.closeDrawer();
        this.load(this.editId ? this.page : 1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  async confirmDelete(d: Discount): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Offer',
      message: `Delete "${d.name}"?`,
      note: 'This deletes the discount itself — it is removed from Finance → Discounts and stops applying at checkout. To only hide it from the website, untick "Show on website".',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    this.discountsService.remove(d.id).subscribe({
      next: () => {
        this.notify.success(`"${d.name}" deleted`);
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewing = null;
    this.editId = null;
  }
}
