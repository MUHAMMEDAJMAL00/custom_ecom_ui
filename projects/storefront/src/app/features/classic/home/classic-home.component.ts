import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { ShopNavService } from '../../../core/services/shop-nav.service';
import {
  HomeSection,
  HomeSectionItem,
  HomeSections,
  StoreBanner,
  StoreCategory,
  StoreProduct,
  StorefrontBootstrap,
} from '../../../core/models/storefront.model';
import { resolveImageUrl } from '../../../core/utils/image.util';
import {
  BrandCard,
  DealCard,
  LuxeCard,
  LuxePerk,
  PackCard,
  StoryLink,
  BRAND_CARDS,
  CATEGORY_TILES,
  CONNECT_PHOTOS,
  DEAL_CARDS,
  HERO_SLIDES,
  HeroSlide,
  HomeLink,
  LUXE_CARDS,
  LUXE_PERKS,
  PACK_CARDS,
  SOCIALS,
  STORY_LINKS,
  TRENDING,
  VALUE_FALLBACK,
} from '../classic-content';

// Classic template home — ported from myskin_web features/home/pages/home.
// Same sections, order and markup; data comes from the tenant (banners, categories,
// Home Sections) and the built-in content fills any section the shop has no cards for.

interface CategoryView {
  name: string;
  image: string;
  categoryId?: number;
  link: HomeLink;
}

interface ValueView {
  name: string;
  price: string;
  image: string;
  link: HomeLink;
}

interface OfferView {
  icon: string;
  title: string;
  highlight: string;
  note: string;
}

/** Section headings and copy; replaced by the shop's Home Sections when they load. */
interface SectionHead {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlight: string;
  cta: string;
  image: string;
  link: HomeLink;
}

const HERO_INTERVAL_MS = 6000;

const head = (h: Partial<SectionHead>): SectionHead => ({
  eyebrow: '', title: '', subtitle: '', highlight: '', cta: '', image: '', link: {}, ...h,
});

const DEFAULT_HEADS: Record<string, SectionHead> = {
  deals: head({ title: 'Limited Time Deals', cta: 'View All', link: { anchor: 'value' } }),
  packs: head({ title: 'Gift Packs', cta: 'View All', link: { keywords: ['gift'] } }),
  brands: head({ title: 'Big Brands, Irresistible Prices' }),
  hot_offers: head({ eyebrow: "Season's", title: 'Hottest Offers', highlight: 'Up to 60% OFF', cta: 'Shop Now', image: DEAL_CARDS[2].image, link: { anchor: 'value' } }),
  value: head({ title: 'More To Love, Better Value' }),
  luxe: head({ title: 'Premium Picks', subtitle: 'Hand-picked favourites' }),
  stories: head({ title: 'Spotlight Stories' }),
  connect: head({ title: 'Connect With Us' }),
};

@Component({
  standalone: false,
  selector: 'app-classic-home',
  templateUrl: './classic-home.component.html',
  styleUrls: ['./classic-home.component.scss'],
})
export class ClassicHomeComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) bootstrap!: StorefrontBootstrap;
  @Input() categoryTree: StoreCategory[] = [];
  @Input() banners: StoreBanner[] = [];
  @Input() sections: HomeSections = {};
  @Input() products: StoreProduct[] = [];

  heroSlides: HeroSlide[] = HERO_SLIDES;
  heads: Record<string, SectionHead> = { ...DEFAULT_HEADS };
  deals: DealCard[] = DEAL_CARDS;
  packs: PackCard[] = PACK_CARDS;
  brands: BrandCard[] = BRAND_CARDS;
  luxeCards: LuxeCard[] = LUXE_CARDS;
  luxePerks: LuxePerk[] = LUXE_PERKS;
  stories: StoryLink[] = STORY_LINKS;
  trending: typeof TRENDING & HomeLink = TRENDING;
  connectPhotos: string[] = CONNECT_PHOTOS;
  readonly socials = SOCIALS;
  offers: OfferView[] = [];

  heroIndex = 0;
  categories: CategoryView[] = this.fallbackCategories();
  valueItems: ValueView[] = this.fallbackValueItems();

  /** Sections the shop switched off */
  private hidden = new Set<string>();
  private heroTimer?: ReturnType<typeof setInterval>;

  constructor(private nav: ShopNavService) {}

  /** "Live Rewards | Up to 40% OFF" → the two parts either side of the bar. */
  get rewardsParts(): string[] {
    return this.heads['luxe'].highlight.split('|').map((p) => p.trim());
  }

  /** False when the shop switched the section off. */
  show(key: string): boolean {
    return !this.hidden.has(key);
  }

  ngOnChanges(): void {
    this.offers = this.buildOffers();

    if (this.categoryTree.length) {
      this.categories = this.categoryTree.slice(0, 8).map((c) => this.toCategoryView(c));
    }

    if (this.banners.length) {
      this.heroSlides = this.banners.map((banner, i) => this.toHeroSlide(banner, i));
      this.heroIndex = 0;
    }

    this.applySections(this.sections);
    // As in MySkin: without "More to love" cards from the admin, the newest products show
    if (!this.sections['value']?.items?.length && this.products.length) {
      this.valueItems = this.products.map((p, i) => ({
        name: p.name,
        price: `Under ${this.bootstrap.tenant.currency === 'INR' ? '₹' : this.bootstrap.tenant.currency + ' '}${roundUpPrice(Number(p.selling_price) || 0)}`,
        image: p.image_url ? resolveImageUrl(p.image_url) : VALUE_FALLBACK[i % VALUE_FALLBACK.length].image,
        link: {},
      }));
    }
    this.startHeroTimer();
  }

  ngOnDestroy(): void {
    clearInterval(this.heroTimer);
  }

  goToSlide(index: number): void {
    this.heroIndex = index;
    this.startHeroTimer();
  }

  /** Every card, banner and section link goes through the shop navigation. */
  open(link: HomeLink): void {
    this.nav.open(link);
  }

  openCategory(item: CategoryView): void {
    this.open(item.categoryId ? { categoryId: item.categoryId } : item.link);
  }

  viewAllCategories(): void {
    this.open({ keywords: [] });
  }

  private startHeroTimer(): void {
    clearInterval(this.heroTimer);
    if (this.heroSlides.length < 2) return;
    this.heroTimer = setInterval(() => {
      this.heroIndex = (this.heroIndex + 1) % this.heroSlides.length;
    }, HERO_INTERVAL_MS);
  }

  /** MySkin's offer strips come from the offers module; until it is ported, show shop basics. */
  private buildOffers(): OfferView[] {
    const currency = this.bootstrap.tenant.currency;
    const offers: OfferView[] = [
      { icon: 'bi-truck', title: 'Free Shipping', highlight: `Above ${currency} 999`, note: 'On every order across the shop' },
      { icon: 'bi-shield-lock', title: 'Secure Checkout', highlight: 'SSL encrypted', note: 'Pay safely with trusted methods' },
    ];
    if (this.bootstrap.features['returns']) {
      offers.push({ icon: 'bi-arrow-repeat', title: 'Easy Returns', highlight: 'Hassle free', note: 'Changed your mind? Send it back' });
    }
    return offers;
  }

  /** Applies the shop's sections; anything missing keeps the built-in content. */
  private applySections(sections: HomeSections): void {
    const keys = Object.keys(sections);
    if (!keys.length) return; // no sections: keep built-in content
    this.hidden.clear();
    for (const key of [...Object.keys(DEFAULT_HEADS), 'packs', 'perks', 'trending']) {
      if (!sections[key]) this.hidden.add(key);
    }
    for (const key of keys) {
      if (DEFAULT_HEADS[key]) this.heads[key] = this.toHead(sections[key], DEFAULT_HEADS[key]);
    }
    const items = (key: string) => sections[key]?.items ?? [];

    if (items('deals').length) {
      this.deals = items('deals').map((i) => ({
        eyebrow: i.eyebrow || '', value: i.title, label: i.subtitle || '',
        image: resolveImageUrl(i.image_url), style: (['round', 'wide', 'model'].includes(i.style || '') ? i.style : 'round') as DealCard['style'],
        ...this.linkOf(i),
      }));
    }
    if (items('packs').length) {
      this.packs = items('packs').map((i) => ({
        title: i.title, subtitle: i.subtitle || '', image: resolveImageUrl(i.image_url), tint: i.tint || '#fde3e3', ...this.linkOf(i),
      }));
    }
    if (items('brands').length) {
      this.brands = items('brands').map((i) => ({
        name: i.title, offer: i.eyebrow || '', note: i.subtitle || '', image: resolveImageUrl(i.image_url), ...this.linkOf(i),
      }));
    }
    if (items('value').length) {
      this.valueItems = items('value').map((i) => ({
        name: i.title, price: i.subtitle || '', image: resolveImageUrl(i.image_url), link: this.linkOf(i),
      }));
    }
    if (items('luxe').length) {
      this.luxeCards = items('luxe').map((i) => ({
        title: i.title, subtitle: i.subtitle || '', image: resolveImageUrl(i.image_url), ...this.linkOf(i),
      }));
    }
    if (items('perks').length) {
      this.luxePerks = items('perks').map((i) => ({ icon: i.icon || 'bi-star', title: i.title, note: i.subtitle || '' }));
    }
    if (items('stories').length) {
      this.stories = items('stories').map((i) => ({ label: i.title, ...this.linkOf(i) }));
    }
    const trending = sections['trending'];
    if (trending) {
      const images = items('trending').map((i) => resolveImageUrl(i.image_url)).filter(Boolean);
      this.trending = {
        title: trending.title || TRENDING.title,
        subtitle: trending.subtitle || '',
        offer: trending.highlight || '',
        images: images.length ? images : TRENDING.images,
        keywords: [],
        ...this.sectionLink(trending),
      };
    }
    if (items('connect').length) {
      this.connectPhotos = items('connect').map((i) => resolveImageUrl(i.image_url)).filter(Boolean);
    }
  }

  private toHead(s: HomeSection, fallback: SectionHead): SectionHead {
    return {
      eyebrow: s.eyebrow ?? fallback.eyebrow,
      title: s.title || fallback.title,
      subtitle: s.subtitle ?? '',
      highlight: s.highlight ?? fallback.highlight,
      cta: s.cta_label || fallback.cta,
      image: s.image_url ? resolveImageUrl(s.image_url) : fallback.image,
      link: s.link_url || s.category_id ? this.sectionLink(s) : fallback.link,
    };
  }

  /** Card link: category, page anchor (#value) or URL. */
  private linkOf(i: HomeSectionItem): HomeLink {
    return this.sectionLink(i);
  }

  private sectionLink(s: { link_url: string | null; category_id: number | null }): HomeLink {
    if (s.link_url?.startsWith('#')) return { anchor: s.link_url.slice(1) };
    if (s.link_url) return { url: s.link_url };
    if (s.category_id) return { categoryId: s.category_id };
    return {};
  }

  /** Maps a banner row to the hero slide; missing images fall back to the starter slide's. */
  private toHeroSlide(banner: StoreBanner, index: number): HeroSlide {
    const starter = HERO_SLIDES[index % HERO_SLIDES.length];
    return {
      eyebrow: banner.eyebrow || '',
      title: banner.title,
      titleLine2: banner.title_line2 || '',
      text: banner.text || '',
      cta: banner.cta_label || 'Shop Now',
      script: banner.script || '',
      model: banner.image_url ? resolveImageUrl(banner.image_url) : starter.model,
      products: banner.products_image_url ? resolveImageUrl(banner.products_image_url) : starter.products,
      categoryId: banner.category_id ?? undefined,
      url: banner.link_url ?? undefined,
    };
  }

  private toCategoryView(category: StoreCategory): CategoryView {
    return {
      name: category.name,
      image: category.image_url ? resolveImageUrl(category.image_url) : findTileFor(category.name).image,
      categoryId: category.id,
      link: {},
    };
  }

  private fallbackCategories(): CategoryView[] {
    return CATEGORY_TILES.map((tile) => ({ name: tile.name, image: tile.image, link: tile }));
  }

  private fallbackValueItems(): ValueView[] {
    return VALUE_FALLBACK.map((item) => ({ name: item.name, price: item.price, image: item.image, link: item }));
  }
}

/** Picks the stock tile whose keywords match a category name, else cycles by name length. */
function findTileFor(name: string) {
  const lower = name.toLowerCase();
  return (
    CATEGORY_TILES.find((tile) => tile.keywords?.some((k) => lower.includes(k))) ??
    CATEGORY_TILES[name.length % CATEGORY_TILES.length]
  );
}

/** "Under ₹X" label: next round 50 above the price (MySkin). */
function roundUpPrice(price: number): number {
  return Math.max(50, Math.ceil((price + 1) / 50) * 50 - 1);
}
