import { Component, HostListener, Input, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StoreCategory, StoreProduct, StorefrontBootstrap } from '../../core/models/storefront.model';
import { CartService } from '../../core/services/cart.service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { ShopNavService } from '../../core/services/shop-nav.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** Width of the hover dropdown; keep in sync with .eh-mega in the stylesheet. */
const MEGA_WIDTH = 520;

/**
 * Electro template header: utility bar, logo + category search + account/wishlist/cart,
 * and a category bar with an "All categories" menu (sub-categories included).
 */
@Component({
  selector: 'app-electro-header',
  standalone: false,
  templateUrl: './electro-header.component.html',
  styleUrls: ['./electro-header.component.scss'],
})
export class ElectroHeaderComponent implements OnDestroy {
  @Input({ required: true }) bootstrap!: StorefrontBootstrap;
  @Input() categories: StoreCategory[] = [];

  searchTerm = '';
  searchCategory = '';
  allOpen = false;
  menuOpen = false;
  openParent: number | null = null;

  // Category bar hover dropdown
  hoverCat: StoreCategory | null = null;
  megaLeft = 0;
  /** A few products per category slug, loaded the first time it is hovered. */
  catProducts: Record<string, StoreProduct[]> = {};
  private openTimer?: ReturnType<typeof setTimeout>;
  private closeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private nav: ShopNavService,
    private router: Router,
    private api: StorefrontApiService,
    private shop: ShopContextService,
    readonly auth: CustomerAuthService,
    readonly cart: CartService,
    readonly wishlist: WishlistService,
  ) {}

  get shopName(): string {
    return this.bootstrap.tenant.name;
  }

  get logoUrl(): string {
    return resolveImageUrl(this.bootstrap.tenant.logo_url);
  }

  get wishlistEnabled(): boolean {
    return this.bootstrap.features['wishlist'] === true;
  }

  get brandsEnabled(): boolean {
    return this.bootstrap.features['brands'] === true;
  }

  get topCategories(): StoreCategory[] {
    return this.categories.slice(0, 7);
  }

  ngOnDestroy(): void {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
  }

  /** Opens the dropdown under the hovered category (short delay so passing the pointer over doesn't flicker). */
  openCatMenu(category: StoreCategory, event: MouseEvent): void {
    this.cancelCatClose();
    clearTimeout(this.openTimer);
    const link = event.currentTarget as HTMLElement;
    const bar = link.closest('.eh-cats__inner') as HTMLElement | null;
    const delay = this.hoverCat ? 0 : 120;
    this.openTimer = setTimeout(() => {
      if (bar) {
        const left = link.getBoundingClientRect().left - bar.getBoundingClientRect().left;
        this.megaLeft = Math.max(0, Math.min(left, bar.clientWidth - MEGA_WIDTH));
      }
      this.hoverCat = category;
      this.allOpen = false;
      this.loadCatProducts(category);
    }, delay);
  }

  scheduleCatClose(): void {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => (this.hoverCat = null), 180);
  }

  cancelCatClose(): void {
    clearTimeout(this.closeTimer);
  }

  closeCatMenu(): void {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
    this.hoverCat = null;
  }

  productImage(p: StoreProduct): string {
    return resolveImageUrl(p.image_url);
  }

  openProduct(p: StoreProduct): void {
    this.closeCatMenu();
    this.go(['/catalog', 'product', p.public_id]);
  }

  private loadCatProducts(category: StoreCategory): void {
    if (this.catProducts[category.slug]) return;
    this.api
      .productPage(this.shop.slug, { category: category.slug, limit: 4 })
      .pipe(catchError(() => of(null)))
      .subscribe((page) => (this.catProducts = { ...this.catProducts, [category.slug]: page?.data ?? [] }));
  }

  @HostListener('document:click', ['$event'])
  closeMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.eh-all')) this.allOpen = false;
  }

  isActive(category: StoreCategory): boolean {
    return this.router.url.split(/[?#]/)[0] === `/catalog/category/${category.slug}`;
  }

  search(): void {
    const term = this.searchTerm.trim();
    this.menuOpen = false;
    if (this.searchCategory && !term) {
      void this.router.navigate(['/catalog', 'category', this.searchCategory]);
      return;
    }
    if (!term) return;
    if (this.searchCategory) {
      // Search inside the chosen category: the category page filters by text as well
      void this.router.navigate(['/catalog', 'search'], { queryParams: { q: term, category: this.searchCategory } });
      return;
    }
    this.nav.search(term);
  }

  go(path: string[]): void {
    this.allOpen = false;
    this.menuOpen = false;
    this.hoverCat = null;
    void this.router.navigate(path);
  }

  openCategory(category: StoreCategory): void {
    this.go(['/catalog', 'category', category.slug]);
  }

  account(): void {
    this.go([this.auth.isLoggedIn ? '/account' : '/login']);
  }
}
