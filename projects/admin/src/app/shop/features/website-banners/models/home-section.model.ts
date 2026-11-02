export interface HomeSectionItem {
  id: number;
  section_key: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  style: 'round' | 'wide' | 'model' | null;
  tint: string | null;
  link_url: string | null;
  category_id: number | null;
  product_id: number | null;
  sort_order: number;
  is_active: number;
}

export interface HomeSection {
  id: number;
  section_key: string;
  name: string;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  highlight: string | null;
  cta_label: string | null;
  image_url: string | null;
  link_url: string | null;
  category_id: number | null;
  sort_order: number;
  is_active: number;
  items: HomeSectionItem[];
}

export type SectionField = 'eyebrow' | 'title' | 'subtitle' | 'highlight' | 'cta_label' | 'image_url' | 'link';
export type ItemField = 'eyebrow' | 'title' | 'subtitle' | 'icon' | 'image_url' | 'style' | 'tint' | 'link' | 'product_id';

/** What each home page section lets the admin edit, and what the fields mean there. */
export interface SectionConfig {
  /** Bootstrap icon shown in the section list */
  icon: string;
  hint: string;
  fields: SectionField[];
  fieldLabels?: Partial<Record<SectionField, string>>;
  /** Card editor; omitted for sections without cards */
  items?: {
    noun: string;
    fields: ItemField[];
    labels?: Partial<Record<ItemField, string>>;
    placeholders?: Partial<Record<ItemField, string>>;
  };
}

export const SECTION_CONFIG: Record<string, SectionConfig> = {
  deals: {
    icon: 'bi-lightning-charge',
    hint: 'Offer cards under "Limited Time Deals". Card style: round (small circle image), wide or model (large photo).',
    fields: ['title', 'cta_label', 'link'],
    fieldLabels: { cta_label: '"View all" label' },
    items: {
      noun: 'Deal',
      fields: ['eyebrow', 'title', 'subtitle', 'image_url', 'style', 'link'],
      labels: { eyebrow: 'Small text', title: 'Offer', subtitle: 'Line' },
      placeholders: { eyebrow: 'Up to', title: '40% OFF', subtitle: 'On Makeup Essentials' },
    },
  },
  packs: {
    icon: 'bi-gift',
    hint: 'Gift pack cards under "Dazzling Festive Packs". Tint is the card background colour.',
    fields: ['title', 'cta_label', 'link'],
    fieldLabels: { cta_label: '"View all" label' },
    items: {
      noun: 'Pack',
      fields: ['title', 'subtitle', 'image_url', 'tint', 'link'],
      placeholders: { title: 'Glow & Radiate', subtitle: 'Festive Pack', tint: '#fde3e3' },
    },
  },
  brands: {
    icon: 'bi-award',
    hint: 'Brand tiles in the "Big Brands" band.',
    fields: ['title'],
    items: {
      noun: 'Brand tile',
      fields: ['title', 'eyebrow', 'subtitle', 'image_url', 'link'],
      labels: { title: 'Brand name', eyebrow: 'Offer', subtitle: 'Note' },
      placeholders: { title: 'Glow Edit', eyebrow: 'Up to 50% OFF', subtitle: 'On glow essentials' },
    },
  },
  hot_offers: {
    icon: 'bi-fire',
    hint: 'The red "Season\'s Hottest Offers" band: small line, big title, offer line, button and image.',
    fields: ['eyebrow', 'title', 'highlight', 'cta_label', 'image_url', 'link'],
    fieldLabels: { eyebrow: 'Small line', highlight: 'Offer line', cta_label: 'Button label' },
  },
  value: {
    icon: 'bi-tags',
    hint: 'Cards in "More Beauty, Better Value". With no active cards the newest products are shown instead.',
    fields: ['title'],
    items: {
      noun: 'Value card',
      fields: ['title', 'subtitle', 'image_url', 'link', 'product_id'],
      labels: { title: 'Name', subtitle: 'Price label' },
      placeholders: { title: 'Lipstick', subtitle: 'Under ₹399' },
    },
  },
  luxe: {
    icon: 'bi-gem',
    hint: 'Premium band: heading, sub line, the photo cards, and the rewards line at the bottom ("Live Beauty Rewards | Up to 40% OFF" — the | splits it).',
    fields: ['title', 'subtitle', 'highlight'],
    fieldLabels: { subtitle: 'Sub line', highlight: 'Rewards line' },
    items: {
      noun: 'Luxe card',
      fields: ['title', 'subtitle', 'image_url', 'link'],
      placeholders: { title: 'Glow 100%', subtitle: 'Luxury Skincare' },
    },
  },
  perks: {
    icon: 'bi-patch-check',
    hint: 'Icons row inside the Luxe band. Icon is a Bootstrap icon name, e.g. bi-truck, bi-gift, bi-stars.',
    fields: [],
    items: {
      noun: 'Perk',
      fields: ['icon', 'title', 'subtitle'],
      labels: { subtitle: 'Note' },
      placeholders: { icon: 'bi-truck', title: 'Free Shipping', subtitle: 'On orders ₹999+' },
    },
  },
  stories: {
    icon: 'bi-camera-reels',
    hint: 'Link buttons under "Spotlight Stories".',
    fields: ['title'],
    items: { noun: 'Story link', fields: ['title', 'link'], labels: { title: 'Label' }, placeholders: { title: 'Glam Hub' } },
  },
  trending: {
    icon: 'bi-graph-up-arrow',
    hint: 'The wide "Trending" banner below the story links: title, second line, offer and up to 3 images.',
    fields: ['title', 'subtitle', 'highlight', 'link'],
    fieldLabels: { subtitle: 'Second line', highlight: 'Offer' },
    items: { noun: 'Image', fields: ['image_url', 'title'], labels: { title: 'Description' } },
  },
  connect: {
    icon: 'bi-people',
    hint: '"Connect With Us" heading and the photos behind it.',
    fields: ['title'],
    items: { noun: 'Photo', fields: ['image_url', 'title'], labels: { title: 'Description' } },
  },
};
