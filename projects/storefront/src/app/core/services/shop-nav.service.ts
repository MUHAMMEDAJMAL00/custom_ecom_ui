import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { HomeLink } from '../../features/classic/classic-content';
import { findCategoryByKeywords, flattenCategories } from '../utils/category-match';
import { ShopContextService } from './shop-context.service';

/**
 * Where every storefront link goes: categories, search, brands, product pages and
 * home-page anchors.
 */
@Injectable({ providedIn: 'root' })
export class ShopNavService {
  /** Short message shown at the bottom of the page ('' = hidden). */
  readonly notice$ = new BehaviorSubject<string>('');
  private noticeTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private router: Router,
    private shop: ShopContextService,
  ) {}

  open(link: HomeLink): void {
    if (link.anchor) {
      this.toAnchor(link.anchor);
      return;
    }
    if (link.url) {
      this.toUrl(link.url);
      return;
    }
    const categories = flattenCategories(this.shop.current?.categories ?? []);
    if (link.categoryId) {
      const category = categories.find((c) => c.id === link.categoryId);
      void this.router.navigate(category ? ['/catalog', 'category', category.slug] : ['/catalog']);
      return;
    }
    if (link.keywords) {
      const category = link.keywords.length ? findCategoryByKeywords(categories, link.keywords) : undefined;
      void this.router.navigate(category ? ['/catalog', 'category', category.slug] : ['/catalog']);
      return;
    }
    this.notify('Choose a category or search for a product.');
  }

  search(term: string): void {
    const q = term.trim();
    if (q) void this.router.navigate(['/catalog', 'search'], { queryParams: { q } });
  }

  product(product: { public_id: string; name: string }): void {
    void this.router.navigate(['/catalog', 'product', product.public_id]);
  }

  home(): void {
    void this.router.navigate(['/']);
  }

  notify(message: string): void {
    this.notice$.next(message);
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => this.notice$.next(''), 3200);
  }

  private toAnchor(anchor: string): void {
    if (anchor === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // Anchor lives on the home page
    void this.router.navigate(['/'], { fragment: anchor }).then(() =>
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 300),
    );
  }

  /** Links set in the admin: full URLs leave the site; paths like /catalog/category/x route here. */
  private toUrl(url: string): void {
    if (/^https?:\/\//i.test(url)) {
      window.location.href = url;
      return;
    }
    if (url.startsWith('#')) {
      this.toAnchor(url.slice(1));
      return;
    }
    void this.router.navigateByUrl(url.startsWith('/') ? url : `/${url}`);
  }
}
