import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { StoreCategory, StorefrontBootstrap } from '../../core/models/storefront.model';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { ShopContextService } from '../../core/services/shop-context.service';

/** Electro template footer: newsletter band, link columns, contact and payment badges. */
@Component({
  selector: 'app-electro-footer',
  standalone: false,
  template: `
    @if (newsletterEnabled) {
      <section class="ef-news">
        <div class="ef-container ef-news__inner">
          <div>
            <strong><i class="bi bi-envelope-paper"></i> Get deals in your inbox</strong>
            <span>New launches and price drops, no spam.</span>
          </div>
          <form (submit)="subscribe(); $event.preventDefault()">
            <input type="email" name="email" [(ngModel)]="email" placeholder="Your email address" required />
            <button type="submit" [disabled]="subscribing">{{ subscribing ? '…' : 'Subscribe' }}</button>
          </form>
          @if (message) { <small class="ef-news__msg">{{ message }}</small> }
        </div>
      </section>
    }
    <footer class="ef">
      <div class="ef-container ef__grid">
        <div class="ef__brand">
          <span class="ef__logo"><i class="bi bi-lightning-charge-fill"></i> {{ bootstrap.tenant.name }}</span>
          <p>{{ bootstrap.seo.description || 'Electronics and electrical products with genuine warranty and fast delivery.' }}</p>
          <a [href]="'mailto:' + bootstrap.tenant.email"><i class="bi bi-envelope"></i> {{ bootstrap.tenant.email }}</a>
          @if (bootstrap.tenant.phone) {
            <a [href]="'tel:' + bootstrap.tenant.phone"><i class="bi bi-telephone"></i> {{ bootstrap.tenant.phone }}</a>
          }
        </div>
        <div>
          <h4>Shop</h4>
          @for (c of categories.slice(0, 6); track c.id) {
            <a (click)="go(['/catalog', 'category', c.slug])">{{ c.name }}</a>
          }
          <a (click)="go(['/catalog'])">All products</a>
        </div>
        <div>
          <h4>Customer service</h4>
          <a (click)="go(['/my-orders'])">Track your order</a>
          <a (click)="go(['/pages', 'refund'])">Returns &amp; refunds</a>
          <a (click)="go(['/account'])">My account</a>
          <a (click)="go(['/cart'])">Cart</a>
        </div>
        <div>
          <h4>Company</h4>
          <a (click)="go(['/pages', 'about'])">About us</a>
          <a (click)="go(['/pages', 'terms'])">Terms &amp; conditions</a>
          <a (click)="go(['/pages', 'privacy'])">Privacy policy</a>
        </div>
      </div>
      <div class="ef-container ef__bottom">
        <span>&copy; {{ year }} {{ bootstrap.tenant.name }}. All rights reserved.</span>
        <span class="ef__pay"><i class="bi bi-credit-card-2-front"></i> Cards · UPI · Net banking · Wallets</span>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); }
    a { cursor: pointer; color: inherit; text-decoration: none; }
    .ef-container { width: var(--page-width); margin: 0 auto; }
    .ef-news { color: #fff; background: var(--brand-primary); }
    .ef-news__inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; padding: 22px 0; }
    .ef-news__inner strong { display: block; font-size: 1.05rem; }
    .ef-news__inner strong i { color: #ffb800; }
    .ef-news__inner span { font-size: 0.85rem; opacity: 0.85; }
    .ef-news form { display: flex; flex: 0 1 440px; height: 44px; overflow: hidden; background: #fff; border-radius: 10px; }
    .ef-news input { flex: 1; min-width: 0; padding: 0 14px; font: inherit; border: 0; outline: none; }
    .ef-news button { padding: 0 22px; font: inherit; font-weight: 600; color: #111; background: #ffb800; border: 0; cursor: pointer; }
    .ef-news__msg { flex-basis: 100%; text-align: right; }
    .ef { padding: 40px 0 0; color: rgba(255, 255, 255, 0.72); background: var(--bg-dark); }
    .ef__grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 28px; padding-bottom: 30px; }
    .ef__grid h4 { margin: 0 0 12px; font-size: 0.9rem; color: #fff; }
    .ef__grid a { display: block; padding: 4px 0; font-size: 0.85rem; }
    .ef__grid a:hover { color: #fff; }
    .ef__brand p { margin: 10px 0 12px; font-size: 0.85rem; line-height: 1.6; }
    .ef__brand a i { margin-right: 6px; color: #ffb800; }
    .ef__logo { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .ef__logo i { color: #ffb800; }
    .ef__bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding: 14px 0; font-size: 0.78rem; border-top: 1px solid rgba(255, 255, 255, 0.12); }
    @media (max-width: 860px) { .ef__grid { grid-template-columns: 1fr 1fr; } .ef__brand { grid-column: 1 / -1; } }
  `],
})
export class ElectroFooterComponent {
  @Input({ required: true }) bootstrap!: StorefrontBootstrap;
  @Input() categories: StoreCategory[] = [];

  readonly year = new Date().getFullYear();
  email = '';
  subscribing = false;
  message = '';

  constructor(
    private router: Router,
    private api: StorefrontApiService,
    private shop: ShopContextService,
  ) {}

  get newsletterEnabled(): boolean {
    return this.bootstrap.features['newsletter'] === true;
  }

  go(path: string[]): void {
    void this.router.navigate(path);
  }

  subscribe(): void {
    const email = this.email.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.message = 'Please enter a valid email address.';
      return;
    }
    this.subscribing = true;
    this.api.newsletter(this.shop.slug, email).subscribe({
      next: (res) => {
        this.subscribing = false;
        this.message = res?.message || 'Thanks for subscribing!';
        this.email = '';
      },
      error: () => {
        this.subscribing = false;
        this.message = 'Could not subscribe right now. Please try again.';
      },
    });
  }
}
