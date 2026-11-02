import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { StoreCategory, StorefrontBootstrap } from '../../../core/models/storefront.model';
import { ShopContextService } from '../../../core/services/shop-context.service';
import { ShopNavService } from '../../../core/services/shop-nav.service';
import { StorefrontApiService } from '../../../core/services/storefront-api.service';
import { SOCIALS } from '../classic-content';

// Classic template footer — ported from myskin_web shared/components/footer.
// Shop name, contact and categories come from the tenant; the newsletter form shows
// only when the newsletter module is on.

@Component({
  standalone: false,
  selector: 'app-classic-footer',
  templateUrl: './classic-footer.component.html',
  styleUrls: ['./classic-footer.component.scss'],
})
export class ClassicFooterComponent {
  @Input({ required: true }) bootstrap!: StorefrontBootstrap;
  @Input() categories: StoreCategory[] = [];

  readonly year = new Date().getFullYear();
  readonly socials = SOCIALS;
  readonly helpLinks = [
    { label: 'Contact Us', url: '/pages/contact' },
    { label: 'Shipping & Delivery', url: '/pages/shipping' },
    { label: 'Returns & Refunds', url: '/pages/returns' },
    { label: 'Order Tracking', url: '/my-orders' },
  ];
  readonly quickLinks = [
    { label: 'About Us', url: '/pages/about' },
    { label: 'Terms & Conditions', url: '/pages/terms' },
    { label: 'Privacy Policy', url: '/pages/privacy' },
    { label: 'Refund Policy', url: '/pages/refund' },
  ];
  email = '';
  subscribed = false;
  subscribing = false;
  subscribeError = '';

  constructor(
    private nav: ShopNavService,
    private shop: ShopContextService,
    private api: StorefrontApiService,
  ) {}

  get shopName(): string {
    return this.bootstrap.tenant.name;
  }

  get newsletterEnabled(): boolean {
    return this.bootstrap.features['newsletter'] === true;
  }

  get wishlistEnabled(): boolean {
    return this.bootstrap.features['wishlist'] === true;
  }

  openCategory(category: StoreCategory): void {
    this.nav.open({ categoryId: category.id });
  }

  goHome(): void {
    this.nav.home();
  }

  /** Newsletter signup; the API answers even for an existing address. */
  subscribe(): void {
    const email = this.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.subscribeError = 'Enter a valid email address.';
      return;
    }
    this.subscribing = true;
    this.subscribeError = '';
    this.api.newsletter(this.shop.slug, email).subscribe({
      next: () => {
        this.subscribing = false;
        this.subscribed = true;
        this.email = '';
      },
      error: (err: HttpErrorResponse) => {
        this.subscribing = false;
        this.subscribeError = err.error?.message || 'Could not subscribe right now.';
      },
    });
  }
}
