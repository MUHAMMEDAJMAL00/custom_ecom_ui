import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StoreBrand } from '../../core/models/storefront.model';
import { ShopContextService } from '../../core/services/shop-context.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { resolveImageUrl } from '../../core/utils/image.util';

/** All brands of the shop: /catalog/brands. A searchable grid, A–Z; the biggest brands get a "Top" tag. */
@Component({
  selector: 'app-brands-page',
  standalone: false,
  template: `
    <app-shop-shell>
      <div class="ms-container page">
        <nav class="crumbs"><a routerLink="/">Home</a><span>›</span><span>Brands</span></nav>

        <header class="head">
          <div>
            <h1>Shop by brand</h1>
            @if (!loading && brands.length) {
              <small>{{ brands.length }} brands</small>
            }
          </div>
          @if (brands.length) {
            <label class="search">
              <i class="bi bi-search"></i>
              <input type="search" placeholder="Search brands" [value]="query" (input)="onSearch($any($event.target).value)" />
            </label>
          }
        </header>

        @if (loading) {
          <p class="muted">Loading brands…</p>
        } @else if (!brands.length) {
          <div class="empty">
            <i class="bi bi-tags"></i>
            <h2>No brands yet</h2>
            <a class="ms-pill" routerLink="/catalog">Browse all products</a>
          </div>
        } @else if (!visible.length) {
          <p class="muted">No brands match “{{ query }}”.</p>
        } @else {
          <div class="grid">
            @for (b of visible; track b.id) {
              <a class="brand" [style.--bh]="hue(b)" [title]="b.name" [routerLink]="['/catalog', 'brand', b.slug]">
                @if (topIds.has(b.id)) {
                  <span class="brand__tag"><i class="bi bi-star-fill"></i> Top</span>
                }
                <span class="brand__mark">
                  @if (b.logo_url) {
                    <img [src]="logo(b)" [alt]="b.name" loading="lazy" />
                  } @else {
                    {{ initials(b) }}
                  }
                </span>
                <span class="brand__info">
                  <strong>{{ b.name }}</strong>
                  <small>{{ b.product_count }} {{ b.product_count === 1 ? 'product' : 'products' }}</small>
                </span>
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
    .muted { color: var(--text-muted); }

    .page { padding: 14px 0 40px; }
    .crumbs { display: flex; gap: 6px; font-size: 0.78rem; color: var(--text-muted); }
    .crumbs a:hover { color: var(--brand-primary); }

    .head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px;
      padding: 8px 0 10px; margin-bottom: 14px; border-bottom: 2px solid var(--border-light); }
    .head h1 { margin: 0; font-size: 1.35rem; font-weight: 700; }
    .head small { font-size: 0.8rem; color: var(--text-muted); }

    .search { display: flex; align-items: center; gap: 8px; width: min(280px, 100%); height: 36px; padding: 0 12px;
      background: var(--bg-card); border: 1px solid var(--border); border-radius: 999px; }
    .search:focus-within { border-color: var(--brand-primary); }
    .search i { color: var(--text-muted); }
    .search input { flex: 1; min-width: 0; font: inherit; font-size: 0.86rem; color: var(--text-primary); background: none; border: 0; outline: 0; }

    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }

    /* --bh is a per-brand hue set from the template */
    .brand { --c: hsl(var(--bh, 210) 70% 45%); --c-soft: hsl(var(--bh, 210) 80% 96%);
      position: relative; display: flex; align-items: center; gap: 10px; padding: 10px 12px; overflow: hidden;
      background: linear-gradient(135deg, var(--c-soft), var(--bg-card) 70%); border: 1px solid var(--border-light);
      border-left: 3px solid var(--c); border-radius: 8px;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition); }
    .brand:hover { border-color: var(--c); box-shadow: 0 4px 12px hsl(var(--bh, 210) 70% 45% / 0.18); transform: translateY(-1px); }
    .brand:hover .brand__mark { color: #fff; background: var(--c); }
    .brand:hover strong { color: var(--c); }

    .brand__mark { display: grid; flex: 0 0 42px; place-items: center; width: 42px; height: 42px; overflow: hidden;
      font-size: 0.85rem; font-weight: 800; color: var(--c); background: #fff;
      border: 1px solid hsl(var(--bh, 210) 70% 45% / 0.25); border-radius: 8px; transition: color var(--transition), background var(--transition); }
    .brand__mark img { width: 100%; height: 100%; padding: 4px; object-fit: contain; background: #fff; }

    .brand__info { display: flex; flex-direction: column; min-width: 0; }
    .brand__info strong { overflow: hidden; font-size: 0.88rem; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; transition: color var(--transition); }
    .brand__info small { font-size: 0.72rem; color: var(--text-muted); }

    .brand__tag { position: absolute; top: 0; right: 0; padding: 2px 7px; font-size: 0.62rem; font-weight: 700; color: #fff;
      text-transform: uppercase; letter-spacing: 0.03em; background: var(--c); border-bottom-left-radius: 6px; }
    .brand__tag i { font-size: 0.55rem; }

    .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 16px; text-align: center; }
    .empty i { font-size: 2.2rem; color: var(--brand-primary); }
    .ms-pill { padding: 10px 22px; font-size: 0.85rem; color: #fff; background: var(--brand-gradient); border-radius: var(--btn-radius, var(--radius-full)); }

    @media (max-width: 560px) {
      .grid { grid-template-columns: 1fr 1fr; gap: 8px; }
      .search { width: 100%; }
    }
  `],
})
export class BrandsPageComponent implements OnInit {
  brands: StoreBrand[] = [];
  visible: StoreBrand[] = [];
  topIds = new Set<number>();
  query = '';
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
        this.brands = [...brands].sort((a, b) => a.name.localeCompare(b.name));
        this.visible = this.brands;
        this.topIds = new Set(
          brands
            .filter((b) => b.product_count > 0)
            .sort((a, b) => b.product_count - a.product_count)
            .slice(0, 3)
            .map((b) => b.id),
        );
        this.loading = false;
      });
  }

  onSearch(value: string): void {
    this.query = value.trim();
    const q = this.query.toLowerCase();
    this.visible = q ? this.brands.filter((b) => b.name.toLowerCase().includes(q)) : this.brands;
  }

  logo(b: StoreBrand): string {
    return resolveImageUrl(b.logo_url);
  }

  /** Stable hue per brand (hashed from its name) so each tile gets its own accent colour. */
  hue(b: StoreBrand): number {
    let h = 0;
    for (const ch of b.name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  initials(b: StoreBrand): string {
    return b.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }
}
