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

  products: StoreProduct[] = [];
  total = 0;
  page = 1;
  totalPages = 1;
  sort = '';
  loading = true;
  notFound = false;
  currency = 'INR';
  brandsEnabled = false;

  readonly sorts = [
    { value: '', label: 'Name (A–Z)' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
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
          this.loading = true;
          this.notFound = false;
          return combineLatest([this.shop.load(), of(params.get('slug') || '')]);
        }),
        switchMap(([ctx, slug]) => {
          this.currency = ctx.bootstrap.tenant.currency || 'INR';
          this.brandsEnabled = ctx.bootstrap.features['brands'] === true;
          this.describe(ctx.categories, slug);
          const q: ProductQuery = { page: this.page, limit: PAGE_SIZE, sort: this.sort || undefined };
          if (this.mode === 'category') q.category = slug;
          if (this.mode === 'brand') q.brand = slug;
          if (this.mode === 'search') q.search = this.searchTerm;
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

  categoryImage(c: StoreCategory): string {
    return c.image_url ? resolveImageUrl(c.image_url) : '';
  }
}
