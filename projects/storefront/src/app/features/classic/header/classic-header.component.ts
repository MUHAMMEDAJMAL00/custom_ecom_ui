import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StoreCategory, StorefrontBootstrap } from '../../../core/models/storefront.model';
import { CartService } from '../../../core/services/cart.service';
import { CustomerAuthService } from '../../../core/services/customer-auth.service';
import { ShopNavService } from '../../../core/services/shop-nav.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { HomeLink } from '../classic-content';

interface NavItem {
  label: string;
  link: HomeLink;
}

// Classic template header — ported from myskin_web shared/components/header.
// The MySkin wordmark becomes the shop's logo or name; the fixed MySkin menu becomes
// the shop's top-level categories. Cart, wishlist and account open with their modules.

@Component({
  standalone: false,
  selector: 'app-classic-header',
  templateUrl: './classic-header.component.html',
  styleUrls: ['./classic-header.component.scss'],
})
export class ClassicHeaderComponent {
  @Input({ required: true }) bootstrap!: StorefrontBootstrap;
  @Input() categories: StoreCategory[] = [];

  searchTerm = '';
  menuOpen = false;
  expandedCategoryId: number | null = null;

  constructor(
    private nav: ShopNavService,
    private router: Router,
    readonly auth: CustomerAuthService,
    readonly cart: CartService,
    readonly wishlist: WishlistService,
  ) {}

  get shopName(): string {
    return this.bootstrap.tenant.name;
  }

  get tagline(): string {
    const description = this.bootstrap.seo.description;
    return description && description.length <= 28 ? description : 'Online store';
  }

  get wishlistEnabled(): boolean {
    return this.bootstrap.features['wishlist'] === true;
  }

  get brandsEnabled(): boolean {
    return this.bootstrap.features['brands'] === true;
  }

  /** Where to come back after sign-in; empty on the auth pages themselves. */
  get loginReturnUrl(): string {
    const url = this.router.url;
    return /^\/(login|signup|forgot-password)/.test(url) ? '' : url;
  }

  get navItems(): NavItem[] {
    const items: NavItem[] = [
      { label: 'Home', link: {} },
      { label: 'Shop all', link: { url: '/catalog' } },
      ...this.categories.slice(0, 5).map((c) => ({ label: c.name, link: { categoryId: c.id } })),
    ];
    if (this.brandsEnabled) items.push({ label: 'Brands', link: { url: '/catalog/brands' } });
    return items;
  }

  /** Home item is first; it is active on the home page, a category on its own page. */
  isActive(item: NavItem, first: boolean): boolean {
    const url = this.router.url.split(/[?#]/)[0];
    if (first) return url === '/' || url === '';
    if (item.link.url) return url === item.link.url;
    const category = this.categories.find((c) => c.id === item.link.categoryId);
    return !!category && url === `/catalog/category/${category.slug}`;
  }

  navigate(item: NavItem): void {
    this.menuOpen = false;
    if (item === this.navItems[0] || item.label === 'Home') {
      this.nav.home();
      return;
    }
    this.nav.open(item.link);
  }

  openCategory(category: StoreCategory): void {
    this.menuOpen = false;
    this.nav.open({ categoryId: category.id });
  }

  toggleExpanded(categoryId: number): void {
    this.expandedCategoryId = this.expandedCategoryId === categoryId ? null : categoryId;
  }

  search(): void {
    if (!this.searchTerm.trim()) return;
    this.menuOpen = false;
    this.nav.search(this.searchTerm);
  }
}
