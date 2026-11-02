import { mediaUrl } from '../../../../core/utils/media.util';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CategoryOption, NamedOption, Product, ProductVariantItem, SellerOption, TaxGroupOption, UnitOption } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

type DrawerMode = 'form' | 'view' | null;

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '1';
  categoryFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  categories: CategoryOption[] = [];
  brands: NamedOption[] = [];
  sellers: SellerOption[] = [];
  units: UnitOption[] = [];
  taxGroups: TaxGroupOption[] = [];

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;
  viewingProduct: Product | null = null;

  form: ReturnType<FormBuilder['group']>;

  // Variant management
  variants: ProductVariantItem[] = [];
  /** False while the edited product's variants failed to load: saving then leaves them untouched. */
  variantsLoaded = true;
  editingVariantIndex: number | null = null;
  variantFormOpen = false;
  variantSaving = false;
  variantForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category_id: [''],
      is_service: [0],
      sku: ['', Validators.required],
      barcode: [''],
      brand_id: [''],
      seller_id: [''],
      is_active: [1],
      unit_id: [''],
      unit_value: [''],
      purchase_price: [0],
      selling_price: [0, Validators.required],
      mrp: [null],
      tax_group_id: [''],
      tax_included: [0],
      hsn_code: [''],
      alert_quantity: [5],
      max_quantity: [null],
      description: [''],
    });

    this.variantForm = this.fb.group({
      variant_name: ['', Validators.required],
      sku: [''],
      barcode: [''],
      purchase_price: [0],
      selling_price: [0, Validators.required],
      mrp: [null],
      quantity: [null],
      unit: [''],
      image_url: [''],
      is_active: [1],
    });
  }

  ngOnInit(): void {
    this.refreshLookups();
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.productsService
      .getAll({
        page: this.page,
        limit: this.limit,
        search: this.search || undefined,
        is_active: this.statusFilter || undefined,
        category_id: this.categoryFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.products = res.data.map((p) => ({ ...p, stock_qty: this.computeStock(p) } as Product & { stock_qty: number }));
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load products.';
          this.loading = false;
        },
      });
  }

  computeStock(p: Product): number {
    return (p.ProductInventories || []).reduce((sum, inv) => sum + (Number(inv.quantity) || 0), 0);
  }

  stockClass(p: Product): string {
    const qty = this.computeStock(p);
    const alert = p.alert_quantity || 5;
    if (qty === 0) return 'qty-zero';
    if (qty <= alert) return 'qty-low';
    return 'qty-ok';
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

  unitName(unitId: number | null): string {
    if (!unitId) return '';
    return this.units.find((u) => u.id === unitId)?.name || '';
  }

  variantCount(p: any): number {
    return (p.Variants || []).filter((v: any) => v.is_active).length;
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.variants = [];
    this.variantsLoaded = true;
    this.form.reset({
      name: '', category_id: '', is_service: 0, sku: '', barcode: '', brand_id: '', seller_id: '', is_active: 1,
      unit_id: '', unit_value: '', purchase_price: 0, selling_price: 0, mrp: null,
      tax_group_id: '', tax_included: 0, hsn_code: '', alert_quantity: 5, max_quantity: null, description: '',
    });
    this.drawerMode = 'form';
  }

  refreshLookups(): void {
    forkJoin({
      categories: this.productsService.getCategories(),
      units: this.productsService.getUnits(),
      taxGroups: this.productsService.getTaxGroups(),
    }).subscribe({
      next: (res) => {
        this.categories = res.categories;
        this.units = res.units;
        this.taxGroups = res.taxGroups;
      },
      error: () => {},
    });
    // Optional modules/lookups must not break the required ones.
    this.productsService.getBrands().subscribe({
      next: (brands) => (this.brands = brands),
      error: () => (this.brands = []),
    });
    this.productsService.getApprovedSellers().subscribe({
      next: (sellers) => (this.sellers = sellers),
      error: () => (this.sellers = []),
    });
  }

  openEdit(product: Product): void {
    this.refreshLookups();
    this.productsService.getById(product.id).subscribe({
      next: (p) => {
        this.editId = p.id;
        this.form.reset({
          name: p.name,
          category_id: p.category_id ?? '',
          is_service: p.is_service,
          sku: p.sku,
          barcode: p.barcode || '',
          brand_id: p.brand_id ?? '',
          seller_id: p.seller_id ?? '',
          is_active: p.is_active,
          unit_id: p.unit_id ?? '',
          unit_value: p.unit_value || '',
          purchase_price: p.purchase_price,
          selling_price: p.selling_price,
          mrp: p.mrp,
          tax_group_id: p.tax_group_id ?? '',
          tax_included: p.tax_included,
          hsn_code: p.hsn_code || '',
          alert_quantity: p.alert_quantity,
          max_quantity: p.max_quantity,
          description: p.description || '',
        });
        this.loadVariants(p.id);
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load product'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return `Product Details — ${this.viewingProduct?.name ?? ''}`;
    return this.editId ? 'Edit Product' : 'Add Product';
  }

  handleSave(): void {
    if (this.form.invalid) {
      this.notify.warning('Product name, SKU and selling price are required');
      return;
    }
    const raw = this.form.getRawValue();
    const payload: any = {
      name: (raw.name || '').trim(),
      sku: (raw.sku || '').trim(),
      brand_id: raw.brand_id ? parseInt(raw.brand_id, 10) : null,
      seller_id: raw.seller_id ? parseInt(raw.seller_id, 10) : null,
      hsn_code: raw.hsn_code?.trim() || null,
      selling_price: parseFloat(raw.selling_price) || 0,
      mrp: raw.mrp !== null && raw.mrp !== '' ? parseFloat(raw.mrp) : null,
      purchase_price: parseFloat(raw.purchase_price) || 0,
      tax_group_id: raw.tax_group_id ? parseInt(raw.tax_group_id, 10) : null,
      tax_included: parseInt(raw.tax_included, 10) || 0,
      alert_quantity: parseInt(raw.alert_quantity, 10) || 5,
      max_quantity: raw.max_quantity !== null && raw.max_quantity !== '' ? parseInt(raw.max_quantity, 10) : null,
      category_id: raw.category_id ? parseInt(raw.category_id, 10) : null,
      unit_id: raw.unit_id ? parseInt(raw.unit_id, 10) : null,
      unit_value: raw.unit_id ? raw.unit_value?.trim() || null : null,
      description: raw.description?.trim() || null,
      barcode: raw.barcode?.trim() || null,
      is_active: parseInt(raw.is_active, 10),
      is_service: parseInt(raw.is_service, 10),
      // Omitting variants keeps the saved ones; sending the list replaces them
      variants: !this.variantsLoaded ? undefined : this.variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        variant_name: v.variant_name,
        sku: v.sku || null,
        barcode: v.barcode || null,
        purchase_price: v.purchase_price,
        selling_price: v.selling_price,
        mrp: v.mrp,
        quantity: v.quantity,
        unit: v.unit || null,
        image_url: v.image_url || null,
        is_active: v.is_active,
      })),
    };

    this.saving = true;
    const request$ = this.editId ? this.productsService.update(this.editId, payload) : this.productsService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Product updated successfully' : 'Product added successfully');
        this.closeDrawer();
        this.load(1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || err.error?.errors?.join(', ') || 'Save failed');
      },
    });
  }

  // ── Variants ────────────────────────────────────────────────
  loadVariants(productId: number): void {
    this.variantsLoaded = false;
    this.productsService.getVariants(productId).subscribe({
      next: (variants) => {
        this.variantsLoaded = true;
        this.variants = variants.map((v: any) => ({
          id: v.id,
          variant_name: v.variant_name,
          sku: v.sku || null,
          barcode: v.barcode || null,
          purchase_price: Number(v.purchase_price),
          selling_price: Number(v.selling_price),
          mrp: v.mrp ? Number(v.mrp) : null,
          quantity: v.quantity ? Number(v.quantity) : null,
          unit: v.unit || null,
          image_url: v.image_url || null,
          is_active: v.is_active,
        }));
      },
      error: () => this.variants = [],
    });
  }

  openAddVariant(): void {
    this.editingVariantIndex = null;
    this.variantForm.reset({ variant_name: '', sku: '', barcode: '', purchase_price: 0, selling_price: 0, mrp: null, quantity: null, unit: '', image_url: '', is_active: 1 });
    this.variantFormOpen = true;
  }

  openEditVariant(index: number): void {
    const v = this.variants[index];
    this.editingVariantIndex = index;
    this.variantForm.reset({
      variant_name: v.variant_name,
      sku: v.sku || '',
      barcode: v.barcode || '',
      purchase_price: v.purchase_price,
      selling_price: v.selling_price,
      mrp: v.mrp,
      quantity: v.quantity,
      unit: v.unit || '',
      image_url: v.image_url || '',
      is_active: v.is_active,
    });
    this.variantFormOpen = true;
  }

  closeVariantForm(): void {
    this.variantFormOpen = false;
    this.editingVariantIndex = null;
  }

  saveVariant(): void {
    if (this.variantForm.invalid) return;
    const raw = this.variantForm.getRawValue();
    const data: ProductVariantItem = {
      variant_name: raw.variant_name,
      sku: raw.sku || null,
      barcode: raw.barcode || null,
      purchase_price: parseFloat(raw.purchase_price) || 0,
      selling_price: parseFloat(raw.selling_price) || 0,
      mrp: raw.mrp !== null && raw.mrp !== '' ? parseFloat(raw.mrp) : null,
      quantity: raw.quantity !== null && raw.quantity !== '' ? parseFloat(raw.quantity) : null,
      unit: raw.unit || null,
      image_url: raw.image_url || null,
      is_active: parseInt(raw.is_active, 10),
    };

    if (this.editingVariantIndex !== null) {
      // Keep the saved id so the server updates this variant instead of adding a new one
      const existingId = this.variants[this.editingVariantIndex].id;
      this.variants[this.editingVariantIndex] = existingId ? { ...data, id: existingId } : data;
    } else {
      this.variants.push(data);
    }
    this.closeVariantForm();
  }

  removeVariant(index: number): void {
    this.variants.splice(index, 1);
  }

  onVariantImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (!this.editId) {
      // Images are uploaded against a saved product; an inline data URL would not be stored
      this.notify.error('Save the product first, then edit it to add variant images');
      input.value = '';
      return;
    }
    // Upload to backend immediately
    this.variantSaving = true;
    this.productsService.uploadVariantImage(this.editId, file).subscribe({
      next: (url) => {
        this.variantForm.patchValue({ image_url: url });
        this.variantSaving = false;
      },
      error: () => {
        this.notify.error('Image upload failed');
        this.variantSaving = false;
      },
    });
  }

  // ── View ───────────────────────────────────────────────────
  openView(product: Product): void {
    this.viewingProduct = product;
    this.drawerMode = 'view';
    this.loadVariants(product.id);
  }

  /** Image src for an uploaded product/variant image. */
  img(url: string | null | undefined): string {
    return mediaUrl(url);
  }

  // ── Delete (deactivates: past sales keep their product) ─────
  async confirmDelete(product: Product): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Deactivate Product',
      message: `Deactivate "${product.name}"?`,
      note: 'It disappears from the shop and POS. Past sales keep it, and you can make it active again by editing it.',
      confirmLabel: 'Deactivate',
    });
    if (!confirmed) return;

    this.productsService.remove(product.id).subscribe({
      next: () => {
        this.notify.success('Product deactivated');
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingProduct = null;
    this.editId = null;
    this.variants = [];
    this.variantsLoaded = true;
    this.variantFormOpen = false;
  }

  formatCurrency(n: number | string | null): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
