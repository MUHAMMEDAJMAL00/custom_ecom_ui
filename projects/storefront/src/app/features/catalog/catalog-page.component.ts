import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ProductQuery, StoreBrand, StoreCategory, StoreProduct } from '../../core/models/storefront.model';
import { ShopContextService } from '../../core/services/shop-context.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { flattenCategories } from '../../core/utils/category-match';
import { resolveImageUrl } from '../../core/utils/image.util';

type Mode = 'all' | 'category' | 'search' | 'brand';

const PAGE_SIZE = 24;

/**
 * Product listing for /catalog (all), /catalog/category/:slug, /catalog/search?q= and
 * /catalog/brand/:slug — breadcrumb, sub-categories, sort and paging.
 */
@Component({
  selector: 'app-catalog-page',
  standalone: false,
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss'],
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  mode: Mode = 'all';
  title = 'All products';
  subtitle = '';
  heroImage = '';
  category: StoreCategory | null = null;
  parent: StoreCategory | null = null;
  children: StoreCategory[] = [];
  brand: StoreBrand | null = null;
  searchTerm = '';
  /** Optional category slug narrowing a search (Electro header search box). */
  searchCategory = '';

  products: StoreProduct[] = [];
  total = 0;
  page = 1;
  totalPages = 1;
  sort = '';
  loading = true;
  notFound = false;
  currency = 'INR';
  brandsEnabled = false;
  wishlistEnabled = false;

  /** Catalogue filters (left sidebar, Flipkart-style). */
  filterCategories: StoreCategory[] = [];
  brands: StoreBrand[] = [];
  selectedBrands: string[] = [];
  minPrice = '';
  maxPrice = '';
  draftMin = '';
  draftMax = '';
  showAllBrands = false;
  filtersOpen = false;
  priceOpen = false;
  private brandsLoaded = false;

  readonly sorts = [
    { value: '', label: 'Recommended' },
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'name', label: 'Name (A–Z)' },
  ];

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: StorefrontApiService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.sub = combineLatest([this.route.paramMap, this.route.queryParamMap, this.route.data])
      .pipe(
        switchMap(([params, query, data]) => {
          this.mode = (data['mode'] as Mode) || 'all';
          this.page = Math.max(1, parseInt(query.get('page') || '1', 10) || 1);
          this.sort = query.get('sort') || '';
          this.searchTerm = query.get('q') || '';
          this.searchCategory = query.get('category') || '';
          this.selectedBrands = (query.get('brands') || '').split(',').map((b) => b.trim()).filter(Boolean);
          this.minPrice = query.get('min_price') || '';
          this.maxPrice = query.get('max_price') || '';
          this.draftMin = this.minPrice;
          this.draftMax = this.maxPrice;
          this.loading = true;
          this.notFound = false;
          return combineLatest([this.shop.load(), of(params.get('slug') || '')]);
        }),
        switchMap(([ctx, slug]) => {
          this.currency = ctx.bootstrap.tenant.currency || 'INR';
          this.brandsEnabled = ctx.bootstrap.features['brands'] === true;
          this.wishlistEnabled = ctx.bootstrap.features['wishlist'] === true;
          this.filterCategories = ctx.categories;
          if (!this.brandsLoaded) this.loadBrands();
          this.describe(ctx.categories, slug);
          const q: ProductQuery = { page: this.page, limit: PAGE_SIZE, sort: this.sort || undefined };
          if (this.mode === 'category') q.category = slug;
          if (this.mode === 'brand') q.brand = slug;
          if (this.mode === 'search') {
            q.search = this.searchTerm;
            if (this.searchCategory) q.category = this.searchCategory;
          }
          if (this.selectedBrands.length) q.brands = this.selectedBrands.join(',');
          if (this.minPrice) q.min_price = this.minPrice;
          if (this.maxPrice) q.max_price = this.maxPrice;
          if (this.mode === 'brand' && !this.brand) {
            this.api.brand(this.shop.slug, slug).pipe(catchError(() => of(null))).subscribe((b) => {
              this.brand = b;
              if (b) {
                this.title = b.name;
                this.heroImage = b.logo_url ? resolveImageUrl(b.logo_url) : '';
              }
            });
          }
          if (this.notFound) return of(null);
          return this.api.productPage(this.shop.slug, q).pipe(catchError(() => of(null)));
        }),
      )
      .subscribe((result) => {
        this.products = result?.data ?? [];
        this.total = result?.total ?? 0;
        this.totalPages = Math.max(1, result?.total_pages ?? 1);
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadBrands(): void {
    this.brandsLoaded = true;
    this.api.brands(this.shop.slug).subscribe({
      next: (brands) => {
        this.brands = brands
          .filter((brand) => Number(brand.product_count) > 0)
          .sort((a, b) => Number(b.product_count) - Number(a.product_count) || a.name.localeCompare(b.name));
      },
      error: () => (this.brands = []),
    });
  }

  get visibleBrands(): StoreBrand[] {
    return this.showAllBrands ? this.brands : this.brands.slice(0, 8);
  }

  get activeFilterCount(): number {
    return this.selectedBrands.length + (this.minPrice || this.maxPrice ? 1 : 0);
  }

  get priceLabel(): string {
    if (!this.minPrice && !this.maxPrice) return 'Price';
    if (this.minPrice && this.maxPrice) return `${this.money(this.minPrice)} – ${this.money(this.maxPrice)}`;
    if (this.minPrice) return `From ${this.money(this.minPrice)}`;
    return `Up to ${this.money(this.maxPrice)}`;
  }

  get priceRanges(): { label: string; min: string; max: string }[] {
    const symbol = this.currencySymbol;
    return [
      { label: `Under ${symbol}500`, min: '', max: '500' },
      { label: `${symbol}500 – ${symbol}1,000`, min: '500', max: '1000' },
      { label: `${symbol}1,000 – ${symbol}2,000`, min: '1000', max: '2000' },
      { label: `${symbol}2,000 – ${symbol}5,000`, min: '2000', max: '5000' },
      { label: `${symbol}5,000 and above`, min: '5000', max: '' },
    ];
  }

  get currencySymbol(): string {
    return this.currency === 'INR' ? '₹' : this.currency === 'USD' ? '$' : this.currency === 'EUR' ? '€' : `${this.currency} `;
  }

  isBrandSelected(slug: string): boolean {
    return this.selectedBrands.includes(slug);
  }

  brandName(slug: string): string {
    return this.brands.find((brand) => brand.slug === slug)?.name || slug;
  }

  toggleBrand(slug: string, checked: boolean): void {
    const next = checked
      ? [...new Set([...this.selectedBrands, slug])]
      : this.selectedBrands.filter((brand) => brand !== slug);
    void this.router.navigate([], {
      queryParams: { brands: next.length ? next.join(',') : null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  removeBrand(slug: string): void {
    this.toggleBrand(slug, false);
  }

  setPriceRange(min: string, max: string): void {
    this.priceOpen = false;
    void this.router.navigate([], {
      queryParams: { min_price: min || null, max_price: max || null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  applyPrice(): void {
    const min = this.draftMin === '' ? '' : String(Math.max(0, parseInt(this.draftMin, 10) || 0));
    const max = this.draftMax === '' ? '' : String(Math.max(0, parseInt(this.draftMax, 10) || 0));
    this.setPriceRange(min, max);
  }

  clearPrice(): void {
    this.draftMin = '';
    this.draftMax = '';
    this.setPriceRange('', '');
  }

  clearFilters(): void {
    void this.router.navigate([], {
      queryParams: { brands: null, min_price: null, max_price: null, page: null },
      queryParamsHandling: 'merge',
    });
  }

  isCategoryActive(category: StoreCategory): boolean {
    return this.category?.id === category.id;
  }

  isPriceRangeActive(range: { min: string; max: string }): boolean {
    return range.min === this.minPrice && range.max === this.maxPrice;
  }

  money(value: string | number): string {
    return `${this.currencySymbol}${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  /** Title, breadcrumb and sub-categories for the current mode. */
  private describe(tree: StoreCategory[], slug: string): void {
    const all = flattenCategories(tree);
    this.category = null;
    this.parent = null;
    this.children = [];
    this.subtitle = '';
    this.heroImage = '';
    if (this.mode === 'category') {
      const category = all.find((c) => c.slug === slug) || null;
      if (!category) {
        this.notFound = true;
        this.title = 'Category not found';
        return;
      }
      this.category = category;
      this.parent = all.find((c) => c.children?.some((child) => child.id === category.id)) || null;
      this.children = category.children ?? [];
      this.title = category.name;
      this.subtitle = category.description || '';
      this.heroImage = category.image_url ? resolveImageUrl(category.image_url) : '';
    } else if (this.mode === 'search') {
      this.title = this.searchTerm ? `Results for “${this.searchTerm}”` : 'Search';
      this.children = tree;
    } else if (this.mode === 'brand') {
      this.brand = null;
      this.title = 'Brand';
    } else {
      this.title = 'All products';
      this.children = tree;
    }
  }

  setSort(value: string): void {
    void this.router.navigate([], { queryParams: { sort: value || null, page: null }, queryParamsHandling: 'merge' });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    void this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  get pages(): number[] {
    const start = Math.max(1, this.page - 2);
    const end = Math.min(this.totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
}
