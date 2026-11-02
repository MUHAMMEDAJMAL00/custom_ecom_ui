import { Component, Input } from '@angular/core';
import { StoreProduct } from '../../core/models/storefront.model';
import { ShopNavService } from '../../core/services/shop-nav.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** Product tile for category, search, brand and related-product grids. */
@Component({
  selector: 'app-product-card',
  standalone: false,
  template: `
    <a class="pc" (click)="nav.product(product)">
      <span class="pc__img">
        <img [src]="image" [alt]="product.name" loading="lazy" />
        @if (discount > 0) {
          <span class="pc__off">{{ discount }}% OFF</span>
        }
      </span>
      <span class="pc__body">
        @if (product.brand) {
          <span class="pc__brand">{{ product.brand }}</span>
        }
        <span class="pc__name">{{ product.name }}</span>
        <span class="pc__price">
          <strong>{{ price | currency: currency : 'symbol' : '1.0-2' }}</strong>
          @if (mrp > price) {
            <s>{{ mrp | currency: currency : 'symbol' : '1.0-2' }}</s>
          }
        </span>
      </span>
    </a>
  `,
  styles: [`
    .pc { display: flex; flex-direction: column; height: 100%; overflow: hidden; color: inherit; text-decoration: none; cursor: pointer;
      background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); transition: box-shadow var(--transition), transform var(--transition); }
    .pc:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .pc__img { position: relative; display: block; aspect-ratio: 1; background: var(--bg-alt); }
    .pc__img img { width: 100%; height: 100%; object-fit: cover; }
    .pc__off { position: absolute; top: 10px; left: 10px; padding: 3px 8px; font-size: 0.68rem; font-weight: 600; color: #fff; background: var(--brand-gradient); border-radius: var(--radius-full); }
    .pc__body { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px 14px; }
    .pc__brand { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand-primary); }
    .pc__name { display: -webkit-box; overflow: hidden; font-size: 0.9rem; line-height: 1.35; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .pc__price { display: flex; align-items: baseline; gap: 8px; margin-top: auto; padding-top: 4px; }
    .pc__price strong { font-size: 1rem; }
    .pc__price s { font-size: 0.8rem; color: var(--text-muted); }
  `],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: StoreProduct;
  @Input() currency = 'INR';

  constructor(readonly nav: ShopNavService) {}

  get image(): string {
    return resolveImageUrl(this.product.image_url);
  }

  get price(): number {
    return Number(this.product.selling_price) || 0;
  }

  get mrp(): number {
    return Number(this.product.mrp) || 0;
  }

  get discount(): number {
    return this.mrp > this.price ? Math.round(((this.mrp - this.price) / this.mrp) * 100) : 0;
  }
}
