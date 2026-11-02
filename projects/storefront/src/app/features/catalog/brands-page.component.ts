import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StoreBrand } from '../../core/models/storefront.model';
import { ShopContextService } from '../../core/services/shop-context.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** All brands of the shop: /catalog/brands. */
@Component({
  selector: 'app-brands-page',
  standalone: false,
  template: `
    <app-shop-shell>
      <section class="hero">
        <div class="ms-container">
          <nav class="crumbs"><a routerLink="/">Home</a><span>›</span><span>Brands</span></nav>
          <h1>Shop by brand</h1>
        </div>
      </section>
      <div class="ms-container body">
        @if (loading) {
          <p class="muted">Loading brands…</p>
        } @else if (!brands.length) {
          <div class="empty">
            <i class="bi bi-tags"></i>
            <h2>No brands yet</h2>
            <a class="ms-pill" routerLink="/catalog">Browse all products</a>
          </div>
        } @else {
          <div class="grid">
            @for (b of brands; track b.id) {
              <a class="brand" [routerLink]="['/catalog', 'brand', b.slug]">
                <span class="brand__logo">
                  @if (b.logo_url) {
                    <img [src]="logo(b)" [alt]="b.name" />
                  } @else {
                    {{ b.name.charAt(0) }}
                  }
                </span>
                <strong>{{ b.name }}</strong>
                <small>{{ b.product_count }} {{ b.product_count === 1 ? 'product' : 'products' }}</small>
              </a>
            }
          </div>
        }
      </div>
    </app-shop-shell>
  `,
  styles: [`
    .ms-container { width: var(--page-width); margin: 0 auto; }
    a { color: inherit; text-decoration: none; }
    .hero { padding: 22px 0 26px; background: var(--brand-soft); border-bottom: 1px solid var(--border-light); }
    .hero h1 { margin: 8px 0 0; font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 600; color: var(--brand-dark); }
    .crumbs { display: flex; gap: 6px; font-size: 0.78rem; color: var(--text-muted); }
    .crumbs a:hover { color: var(--brand-primary); }
    .body { padding: 22px 0 48px; }
    .muted { color: var(--text-muted); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    .brand { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 18px 12px; text-align: center;
      background: var(--bg-card); border: 1px solid var(--border-light); border-radius: var(--radius-lg); transition: box-shadow var(--transition), transform var(--transition); }
    .brand:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .brand__logo { display: grid; place-items: center; width: 72px; height: 72px; overflow: hidden; font-size: 1.6rem; font-weight: 600;
      color: var(--brand-primary); background: var(--brand-soft); border-radius: 50%; }
    .brand__logo img { width: 100%; height: 100%; object-fit: contain; }
    .brand small { color: var(--text-muted); font-size: 0.75rem; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 16px; text-align: center; }
    .empty i { font-size: 2.2rem; color: var(--brand-primary); }
    .ms-pill { padding: 10px 22px; font-size: 0.85rem; color: #fff; background: var(--brand-gradient); border-radius: var(--btn-radius, var(--radius-full)); }
  `],
})
export class BrandsPageComponent implements OnInit {
  brands: StoreBrand[] = [];
  loading = true;

  constructor(
    private api: StorefrontApiService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.api
      .brands(this.shop.slug)
      .pipe(catchError(() => of([] as StoreBrand[])))
      .subscribe((brands) => {
        this.brands = brands;
        this.loading = false;
      });
  }

  logo(b: StoreBrand): string {
    return resolveImageUrl(b.logo_url);
  }
}
