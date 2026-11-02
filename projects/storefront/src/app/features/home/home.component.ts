import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  HomeSections,
  StoreBanner,
  StoreCategory,
  StoreProduct,
  StorefrontBootstrap,
  StoreTheme,
} from '../../core/models/storefront.model';
import { ShopContextService } from '../../core/services/shop-context.service';
import { StorefrontApiService } from '../../core/services/storefront-api.service';
import { applyClassicTheme } from '../../core/utils/theme.util';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  tenantSlug = '';
  tenantInput = '';

  bootstrap: StorefrontBootstrap | null = null;
  categories: StoreCategory[] = [];
  banners: StoreBanner[] = [];
  sections: HomeSections = {};
  products: StoreProduct[] = [];

  loading = true;
  errorMessage = '';
  needsTenant = false;

  readonly benefits = [
    { icon: '✦', title: 'Thoughtfully chosen', text: 'Every product is picked for quality and value.' },
    { icon: '↺', title: 'Easy returns', text: 'Changed your mind? Returns are simple and quick.' },
    { icon: '✉', title: 'Here to help', text: 'Questions are answered by a real person.' },
  ];

  constructor(
    private api: StorefrontApiService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.tenantSlug = this.shop.slug;

    if (!this.tenantSlug && !environment.production) {
      this.loading = false;
      this.needsTenant = true;
      return;
    }

    this.load();
  }

  /** Classic = the MySkin storefront design (features/classic); Minimal = the page below. */
  get isClassic(): boolean {
    return this.bootstrap?.layout_template === 'classic';
  }

  get tenantName(): string {
    return this.bootstrap?.tenant.name || 'Shop';
  }

  get tenantInitial(): string {
    return this.tenantName.charAt(0).toUpperCase();
  }

  get hero(): StoreBanner | null {
    return this.banners[0] ?? null;
  }

  get heroTitle(): string {
    return this.hero?.title || `Welcome to ${this.tenantName}`;
  }

  get heroEyebrow(): string {
    return this.hero?.eyebrow || 'New season';
  }

  get heroText(): string {
    return this.hero?.text || 'Thoughtful products, delivered to your door.';
  }

  get heroCta(): string {
    return this.hero?.cta_label || 'Shop categories';
  }

  get themeVars(): Record<string, string> {
    const theme = this.bootstrap?.theme;
    if (!theme) return {};
    return {
      '--sf-primary': theme.primary,
      '--sf-primary-dark': theme.primary_dark,
      '--sf-tint': theme.tint,
      '--sf-soft': theme.soft,
      '--sf-bg': theme.background,
      '--sf-text': theme.text,
      '--sf-header': theme.header,
      '--sf-footer': theme.footer,
      '--sf-radius': this.radius(theme),
      '--sf-btn': this.buttonBackground(theme),
    };
  }

  get heroArtBackground(): string {
    const theme = this.bootstrap?.theme;
    if (!theme) return 'linear-gradient(135deg, #4f46e5, #7c3aed)';
    return `radial-gradient(circle at 70% 30%, ${this.shade(theme.primary, 0.1)}, ${this.shade(theme.primary_dark, -0.2)})`;
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  openTenant(): void {
    const slug = this.tenantInput.trim().toLowerCase();
    if (!slug) return;
    window.location.href = `/?tenant=${encodeURIComponent(slug)}`;
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  categoryBackground(index: number): string {
    const theme = this.bootstrap?.theme;
    if (!theme) return '#f8fafc';
    const amount = 0.9 - (index % 4) * 0.08;
    return this.shade(theme.primary, amount);
  }

  private load(): void {
    this.loading = true;
    this.errorMessage = '';

    // Bootstrap and categories come from the shared shop context (loaded once per visit)
    this.shop.load().subscribe({
      next: ({ bootstrap, categories }) => {
        this.bootstrap = bootstrap;
        this.categories = categories;
        this.applyTheme(bootstrap);
        this.loadContent();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (!environment.production && !this.tenantSlug) {
          this.needsTenant = true;
          return;
        }
        this.errorMessage =
          error.error?.message || 'This shop is not available right now.';
      },
    });
  }

  private loadContent(): void {
    forkJoin({
      banners: this.api.banners(this.tenantSlug),
      sections: this.api.homeSections(this.tenantSlug),
      products: this.api.products(this.tenantSlug).pipe(catchError(() => of([] as StoreProduct[]))),
    }).subscribe({
      next: ({ banners, sections, products }) => {
        this.products = products;
        this.banners = banners;
        this.sections = sections;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load the shop.';
      },
    });
  }

  private applyTheme(bootstrap: StorefrontBootstrap): void {
    const theme = bootstrap.theme;
    const root = document.documentElement.style;
    root.setProperty('--sf-primary', theme.primary);
    root.setProperty('--sf-primary-dark', theme.primary_dark);
    root.setProperty('--sf-tint', theme.tint);
    root.setProperty('--sf-soft', theme.soft);
    root.setProperty('--sf-bg', theme.background);
    root.setProperty('--sf-text', theme.text);
    root.setProperty('--sf-header', theme.header);
    root.setProperty('--sf-footer', theme.footer);

    applyClassicTheme(theme);

    document.body.style.background = theme.background;
    document.title = bootstrap.seo.title || bootstrap.tenant.name;

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

  private radius(theme: StoreTheme): string {
    return { pill: '999px', rounded: '10px', square: '3px' }[theme.button_shape] || '999px';
  }

  private buttonBackground(theme: StoreTheme): string {
    if (theme.button_style === 'outline') {
      return `transparent`;
    }
    if (theme.button_style === 'solid') return theme.primary;
    return `linear-gradient(135deg, ${theme.primary}, ${theme.primary_dark})`;
  }

  private shade(hex: string, amount: number): string {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    const target = amount < 0 ? 0 : 255;
    const p = Math.abs(amount);
    const channel = (v: number): string =>
      Math.round(v + (target - v) * p).toString(16).padStart(2, '0');
    return `#${channel((n >> 16) & 255)}${channel((n >> 8) & 255)}${channel(n & 255)}`;
  }
}
