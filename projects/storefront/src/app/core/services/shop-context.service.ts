import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StoreCategory, StorefrontBootstrap } from '../models/storefront.model';
import { flattenCategories } from '../utils/category-match';
import { applyClassicTheme } from '../utils/theme.util';
import { StorefrontApiService } from './storefront-api.service';

const TENANT_KEY = 'sf.tenant';

export interface ShopContext {
  bootstrap: StorefrontBootstrap;
  categories: StoreCategory[];
}

/**
 * The shop being viewed, loaded once and shared by every page: bootstrap (profile,
 * theme, features), the category tree, and the theme applied to the page.
 * In production the API finds the shop from the domain; locally ?tenant=<slug> picks it
 * and is remembered for the session so inner pages and reloads keep the same shop.
 */
@Injectable({ providedIn: 'root' })
export class ShopContextService {
  readonly slug: string;
  private context$?: Observable<ShopContext>;
  private snapshot: ShopContext | null = null;

  constructor(private api: StorefrontApiService) {
    const fromUrl = new URLSearchParams(window.location.search).get('tenant') || '';
    let saved = '';
    try {
      saved = sessionStorage.getItem(TENANT_KEY) || '';
      if (fromUrl) sessionStorage.setItem(TENANT_KEY, fromUrl);
    } catch {
      // storage blocked: the URL parameter still works for this page
    }
    this.slug = fromUrl || saved;
  }

  /** True when running locally without a shop picked yet. */
  get needsTenant(): boolean {
    return !this.slug && !environment.production;
  }

  get current(): ShopContext | null {
    return this.snapshot;
  }

  load(): Observable<ShopContext> {
    if (!this.context$) {
      this.context$ = forkJoin({
        bootstrap: this.api.bootstrap(this.slug),
        categories: this.api.categories(this.slug).pipe(catchError(() => of([] as StoreCategory[]))),
      }).pipe(
        tap((ctx) => {
          this.snapshot = ctx;
          this.applyTheme(ctx.bootstrap);
        }),
        shareReplay(1),
      );
    }
    return this.context$;
  }

  /** Every category (top level and children), for slug lookups. */
  allCategories(): Observable<StoreCategory[]> {
    return this.load().pipe(map((ctx) => flattenCategories(ctx.categories)));
  }

  private applyTheme(bootstrap: StorefrontBootstrap): void {
    applyClassicTheme(bootstrap.theme);
    document.body.style.background = bootstrap.theme.background;
    if (bootstrap.tenant.favicon_url) {
      let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement('link');
        icon.rel = 'icon';
        document.head.appendChild(icon);
      }
      icon.href = bootstrap.tenant.favicon_url;
    }
  }
}
