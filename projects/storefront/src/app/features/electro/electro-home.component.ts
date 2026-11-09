import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  HomeSections,
  StoreBanner,
  StoreBrand,
  StoreCategory,
  StoreProduct,
  StorefrontBootstrap,
} from '../../core/models/storefront.model';
import { ShopContextService } from '../../core/services/shop-context.service';
import { ShopNavService } from '../../core/services/shop-nav.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { resolveImageUrl } from '../../core/utils/image.util';
import { HomeLink } from '../classic/classic-content';
import {
  ELECTRO_PROMO,
  ELECTRO_SERVICES,
  ELECTRO_SLIDES,
  ELECTRO_TILES,
  ElectroService,
  ElectroSlide,
  ElectroTile,
  categoryImageFor,
} from './electro-content';

interface CategoryRow {
  category: StoreCategory;
  products: StoreProduct[];
}

const HERO_INTERVAL_MS = 6000;

/**
 * Electro template home: hero slider + promo tiles, service strip, category grid,
 * deals of the day, promo band, a product row per top category and a brand strip.
 * Copy and cards come from the shop's banners and Home Sections (deals = promo tiles,
 * perks = services, value = deals heading, hot_offers = promo band, brands = brands).
 */
@Component({
  selector: 'app-electro-home',
  standalone: false,
  templateUrl: './electro-home.component.html',
  styleUrls: ['./electro-home.component.scss'],
})
export class ElectroHomeComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) bootstrap!: StorefrontBootstrap;
  @Input() categoryTree: StoreCategory[] = [];
  @Input() banners: StoreBanner[] = [];
  @Input() sections: HomeSections = {};
  @Input() products: StoreProduct[] = [];

  slides: ElectroSlide[] = ELECTRO_SLIDES;
  tiles: ElectroTile[] = ELECTRO_TILES;
  services: ElectroService[] = ELECTRO_SERVICES;
  promo = { ...ELECTRO_PROMO, link: {} as HomeLink };
  dealsTitle = 'Deals of the Day';
  dealsSubtitle = 'Limited-time prices on popular products';
  brandsTitle = 'Shop by Brand';
  brands: StoreBrand[] = [];
  rows: CategoryRow[] = [];
  slideIndex = 0;
  currency = 'INR';

  private timer?: ReturnType<typeof setInterval>;

  constructor(
    readonly nav: ShopNavService,
    private api: StorefrontApiService,
    private shop: ShopContextService,
  ) {}

  ngOnChanges(): void {
    this.currency = this.bootstrap.tenant.currency || 'INR';
    if (this.banners.length) {
      this.slides = this.banners.map((b, i) => ({
        eyebrow: b.eyebrow || '',
        title: [b.title, b.title_line2].filter(Boolean).join(' '),
        text: b.text || '',
        cta: b.cta_label || 'Shop now',
        image: b.image_url ? resolveImageUrl(b.image_url) : ELECTRO_SLIDES[i % ELECTRO_SLIDES.length].image,
        categoryId: b.category_id ?? undefined,
        url: b.link_url ?? undefined,
      }));
    }
    this.applySections();
    this.loadRows();
    this.loadBrands();
    this.startTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  /** Products with the biggest discount first, for "Deals of the day". */
  get deals(): StoreProduct[] {
    const off = (p: StoreProduct) => {
      const mrp = Number(p.mrp) || 0;
      const price = Number(p.selling_price) || 0;
      return mrp > price ? (mrp - price) / mrp : 0;
    };
    return [...this.products].sort((a, b) => off(b) - off(a)).slice(0, 10);
  }

  get brandsEnabled(): boolean {
    return this.bootstrap.features['brands'] === true;
  }

  categoryImage(c: StoreCategory): string {
    return c.image_url ? resolveImageUrl(c.image_url) : categoryImageFor(c.name);
  }

  brandLogo(b: StoreBrand): string {
    return resolveImageUrl(b.logo_url);
  }

  /** Stable hue per brand (hashed from its name) so each tile gets its own accent colour. */
  brandHue(b: StoreBrand): number {
    let h = 0;
    for (const ch of b.name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  brandInitials(b: StoreBrand): string {
    return b.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  /** The three brands with the most products get a "Top" highlight. */
  isTopBrand(b: StoreBrand): boolean {
    return b.product_count > 0 && this.topBrandIds.has(b.id);
  }

  private topBrandIds = new Set<number>();

  goToSlide(i: number): void {
    this.slideIndex = i;
    this.startTimer();
  }

  step(delta: number): void {
    this.goToSlide((this.slideIndex + delta + this.slides.length) % this.slides.length);
  }

  open(link: HomeLink): void {
    this.nav.open(link);
  }

  scrollRow(el: HTMLElement, dir: number): void {
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  }

  private startTimer(): void {
    clearInterval(this.timer);
    if (this.slides.length < 2) return;
    this.timer = setInterval(() => (this.slideIndex = (this.slideIndex + 1) % this.slides.length), HERO_INTERVAL_MS);
  }

  private applySections(): void {
    const s = this.sections;
    const items = (key: string) => s[key]?.items ?? [];
    const linkOf = (i: { link_url: string | null; category_id: number | null }): HomeLink =>
      i.link_url ? (i.link_url.startsWith('#') ? { anchor: i.link_url.slice(1) } : { url: i.link_url }) : i.category_id ? { categoryId: i.category_id } : {};

    if (items('deals').length) {
      this.tiles = items('deals').slice(0, 2).map((i, idx) => ({
        eyebrow: i.eyebrow || '',
        title: i.title,
        note: i.subtitle || '',
        image: i.image_url ? resolveImageUrl(i.image_url) : ELECTRO_TILES[idx % ELECTRO_TILES.length].image,
        ...linkOf(i),
      }));
    }
    if (items('perks').length) {
      this.services = items('perks').slice(0, 4).map((i) => ({ icon: i.icon || 'bi-star', title: i.title, note: i.subtitle || '' }));
    }
    if (s['value']) {
      this.dealsTitle = s['value'].title || this.dealsTitle;
      this.dealsSubtitle = s['value'].subtitle || this.dealsSubtitle;
    }
    const hot = s['hot_offers'];
    if (hot) {
      this.promo = {
        eyebrow: hot.eyebrow || ELECTRO_PROMO.eyebrow,
        title: hot.title || ELECTRO_PROMO.title,
        highlight: hot.highlight || ELECTRO_PROMO.highlight,
        cta: hot.cta_label || ELECTRO_PROMO.cta,
        image: hot.image_url ? resolveImageUrl(hot.image_url) : ELECTRO_PROMO.image,
        link: linkOf(hot),
      };
    }
    if (s['brands']?.title) this.brandsTitle = s['brands'].title;
  }

  /** One product row for each of the first top-level categories that has products. */
  private loadRows(): void {
    const top = this.categoryTree.slice(0, 4);
    if (!top.length) {
      this.rows = [];
      return;
    }
    forkJoin(
      top.map((category) =>
        this.api.productPage(this.shop.slug, { category: category.slug, limit: 10, sort: 'newest' }).pipe(
          map((page) => ({ category, products: page.data })),
          catchError(() => of({ category, products: [] as StoreProduct[] })),
        ),
      ),
    ).subscribe((rows) => (this.rows = rows.filter((r) => r.products.length)));
  }

  private loadBrands(): void {
    if (!this.brandsEnabled) return;
    this.api
      .brands(this.shop.slug)
      .pipe(catchError(() => of([] as StoreBrand[])))
      .subscribe((brands) => {
        this.brands = brands.slice(0, 12);
        this.topBrandIds = new Set(
          [...this.brands].sort((a, b) => b.product_count - a.product_count).slice(0, 3).map((b) => b.id),
        );
      });
  }
}
