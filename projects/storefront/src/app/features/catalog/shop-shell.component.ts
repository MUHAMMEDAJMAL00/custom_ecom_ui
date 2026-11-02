import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ShopContext, ShopContextService } from '../../core/services/shop-context.service';

/**
 * Header + page content + footer for every inner storefront page (Classic template).
 * Loads the shop context once; pages render inside it.
 */
@Component({
  selector: 'app-shop-shell',
  standalone: false,
  template: `
    @if (ctx) {
      <app-classic-header [bootstrap]="ctx.bootstrap" [categories]="ctx.categories"></app-classic-header>
      <main class="shop-page">
        <ng-content></ng-content>
      </main>
      <app-classic-footer [bootstrap]="ctx.bootstrap" [categories]="ctx.categories"></app-classic-footer>
    } @else if (error) {
      <div class="shop-state">
        <h1>{{ error }}</h1>
        <a href="/">Back to the shop</a>
      </div>
    } @else {
      <div class="shop-state"><span class="shop-loader"></span></div>
    }
  `,
  styles: [`
    :host { display: block; min-height: 100vh; font-family: var(--font-body); color: var(--text-primary); background: var(--bg-page); }
    .shop-page { padding-top: var(--header-h); min-height: 60vh; }
    .shop-state { display: grid; place-items: center; gap: 12px; min-height: 70vh; text-align: center; }
    .shop-state h1 { font-size: 1.2rem; }
    .shop-state a { color: var(--brand-primary); }
    .shop-loader { width: 28px; height: 28px; border: 3px solid var(--brand-light); border-top-color: var(--brand-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 767px) { .shop-page { padding-top: 0; } }
  `],
})
export class ShopShellComponent implements OnInit {
  ctx: ShopContext | null = null;
  error = '';

  constructor(private shop: ShopContextService) {}

  ngOnInit(): void {
    this.shop.load().subscribe({
      next: (ctx) => (this.ctx = ctx),
      error: (err: HttpErrorResponse) => (this.error = err.error?.message || 'This shop is not available right now.'),
    });
  }
}
