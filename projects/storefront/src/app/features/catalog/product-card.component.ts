import { Component, Input } from '@angular/core';
import { StoreProduct } from '../../core/models/storefront.model';
import { CartService } from '../../core/services/cart.service';
import { ShopNavService } from '../../core/services/shop-nav.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** Product tile for category, search, brand and related-product grids. */
@Component({
  selector: 'app-product-card',
  standalone: false,
  template: `
    <div class="pc" [class.pc--listing]="listing" [class.pc--out]="isOutOfStock">
      @if (showWishlist) {
        <button class="pc__wish" type="button" (click)="toggleWishlist($event)" [attr.aria-label]="'Save ' + product.name">
          <i class="bi bi-heart"></i>
        </button>
      }
      <a class="pc__hit" (click)="nav.product(product)">
        <span class="pc__img">
          <img [src]="image" [alt]="product.name" loading="lazy" />
          @if (discount > 0) {
            <span class="pc__off">{{ discount }}% OFF</span>
          }
          @if (isOutOfStock) {
            <span class="pc__oos">Sold Out</span>
          }
        </span>
        <span class="pc__body">
          @if (product.brand) {
            <span class="pc__brand">{{ product.brand }}</span>
          }
          <span class="pc__name">{{ product.name }}</span>
          @if (listing && product.rating_count) {
            <span class="pc__rating">
              <span>{{ product.rating_avg }} <i class="bi bi-star-fill"></i></span>
              <small>({{ product.rating_count }})</small>
            </span>
          }
          <span class="pc__price">
            <strong>{{ price | currency: currency : 'symbol' : '1.0-2' }}</strong>
            @if (mrp > price) {
              <s>{{ mrp | currency: currency : 'symbol' : '1.0-2' }}</s>
              @if (listing) {
                <em>{{ discount }}% off</em>
              }
            }
          </span>
          @if (listing) {
            <span class="pc__delivery">Free delivery</span>
          }
          @if (stock !== null && stock > 0 && stock <= 5) {
            <span class="pc__stock">Only {{ stock }} left</span>
          }
        </span>
      </a>
      <button type="button" class="pc__cart" [disabled]="isOutOfStock || adding" (click)="addToCart($event)">
        <i class="bi bi-bag-plus"></i> {{ isOutOfStock ? 'Sold Out' : adding ? 'Adding…' : 'Add to Cart' }}
      </button>
    </div>
  `,
  styles: [`
    .pc { position: relative; display: flex; flex-direction: column; height: 100%; overflow: hidden; color: inherit; text-decoration: none; cursor: pointer;
      background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); transition: box-shadow var(--transition), transform var(--transition); }
    .pc:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .pc__hit { display: flex; flex-direction: column; flex: 1; color: inherit; text-decoration: none; }
    .pc__img { position: relative; display: block; aspect-ratio: 1; background: var(--bg-alt); }
    .pc__img img { width: 100%; height: 100%; object-fit: cover; }
    .pc__off { position: absolute; top: 10px; left: 10px; padding: 3px 8px; font-size: 0.68rem; font-weight: 600; color: #fff; background: var(--brand-gradient); border-radius: var(--radius-full); }
    .pc__body { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px 14px; }
    .pc__brand { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand-primary); }
    .pc__name { display: -webkit-box; overflow: hidden; font-size: 0.9rem; line-height: 1.35; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .pc__price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-top: auto; padding-top: 4px; }
    .pc__price strong { font-size: 1rem; }
    .pc__price s { font-size: 0.8rem; color: var(--text-muted); }
    .pc__price em { font-size: 0.74rem; font-style: normal; font-weight: 600; color: #1d7a52; }

    .pc__wish {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      display: grid;
      place-items: center;
      width: 31px;
      height: 31px;
      font-size: 0.95rem;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid var(--border);
      border-radius: 50%;
      box-shadow: var(--shadow-sm);

      &:hover { color: var(--brand-primary); border-color: var(--brand-primary); }
    }

    /* Dense catalogue card (category / search listings) */
    .pc--listing {
      border-radius: var(--radius);
      box-shadow: none;
    }
    .pc--listing:hover { transform: translateY(-1px); }
    .pc--listing .pc__body { gap: 3px; padding: 10px 12px 12px; }
    .pc--listing .pc__brand { font-size: 0.64rem; color: var(--text-muted); }
    .pc--listing .pc__name { min-height: 2.6em; font-size: 0.84rem; }
    .pc--listing .pc__price { gap: 6px; padding-top: 2px; }
    .pc--listing .pc__price strong { font-size: 0.95rem; }
    .pc--listing .pc__price s { font-size: 0.74rem; }
    .pc__rating { display: flex; align-items: center; gap: 5px; margin-top: 1px; }
    .pc__rating > span { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; font-size: 0.66rem; font-weight: 600; color: #fff; background: #1d9a55; border-radius: 3px; }
    .pc__rating i { font-size: 0.52rem; }
    .pc__rating small { font-size: 0.68rem; color: var(--text-muted); }
    .pc__delivery { margin-top: 2px; font-size: 0.7rem; color: var(--text-secondary); }

    /* Add to cart + sold out (same as MySkin's product card) */
    .pc__oos { position: absolute; top: 50%; left: 50%; padding: 6px 16px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; color: #fff;
      background: rgba(42, 26, 32, 0.8); border-radius: var(--radius-full); transform: translate(-50%, -50%); }
    .pc--out .pc__img img { opacity: 0.5; filter: grayscale(0.6); }
    .pc__stock { font-size: 0.7rem; font-weight: 500; color: #c77700; }
    .pc__cart {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 0 14px 14px;
      padding: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--brand-primary);
      background: var(--bg-card);
      border: 1px solid var(--brand-primary);
      border-radius: var(--radius-full);
      transition: background var(--transition), color var(--transition);

      &:hover:not(:disabled) { color: #fff; background: var(--brand-primary); }
      &:disabled { color: var(--text-muted); border-color: var(--border); cursor: default; }
    }
    .pc--listing .pc__cart { margin: 0 12px 12px; }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: StoreProduct;
  @Input() currency = 'INR';
  @Input() listing = false;
  @Input() showWishlist = false;
  adding = false;

  constructor(
    readonly nav: ShopNavService,
    private wishlist: WishlistService,
    private cart: CartService,
  ) {}

  /** The card adds the first variant, like the product page's default choice. */
  private get variant() {
    return this.product.variants?.[0] ?? null;
  }

  /** Stock of what "Add to cart" adds, or null when the shop does not track stock. */
  get stock(): number | null {
    const rows = this.product.ProductInventories;
    if (!rows?.length) return null;
    const key = this.variant?.id ?? null;
    return rows.filter((r) => (r.variant_id ?? null) === key).reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  }

  get isOutOfStock(): boolean {
    return this.stock !== null && this.stock <= 0;
  }

  get image(): string {
    return resolveImageUrl(this.product.image_url);
  }

  get price(): number {
    return Number(this.variant?.selling_price ?? this.product.selling_price) || 0;
  }

  get mrp(): number {
    return Number(this.variant?.mrp ?? this.product.mrp) || 0;
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.isOutOfStock || this.adding) return;
    const variant = this.variant;
    const name = variant ? `${this.product.name} (${variant.variant_name})` : this.product.name;
    this.adding = true;
    this.cart.add(this.product, variant, 1, (ok) => {
      this.adding = false;
      this.nav.notify(ok ? `${name} added to your cart.` : 'Could not add to your cart. Please try again.');
    });
  }

  get discount(): number {
    return this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0;
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist.toggle(this.product);
    this.nav.notify(this.product.name + ' wishlist updated.');
  }
}
