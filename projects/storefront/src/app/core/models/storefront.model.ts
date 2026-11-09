export interface StoreTheme {
  primary: string;
  primary_dark: string;
  tint: string;
  soft: string;
  background: string;
  text: string;
  header: string;
  footer: string;
  button_shape: string;
  button_style: string;
}

export interface StorefrontBootstrap {
  tenant: {
    name: string;
    slug: string;
    logo_url: string | null;
    favicon_url: string | null;
    currency: string;
    locale: string;
    timezone: string;
    email: string;
    phone: string | null;
  };
  layout_template: string;
  theme: StoreTheme;
  features: Record<string, boolean>;
  navigation: { header: unknown[]; footer: unknown[] };
  seo: { title: string; description: string; keywords: string };
}

export interface StoreCategory {
  id: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  children: StoreCategory[];
}

export interface StoreBanner {
  id: number;
  eyebrow: string | null;
  title: string;
  title_line2: string | null;
  text: string | null;
  cta_label: string | null;
  script?: string | null;
  image_url: string | null;
  products_image_url?: string | null;
  category_id: number | null;
  category: { id: number; name: string; slug: string } | null;
  link_url: string | null;
}

/** A home page card (Website → Home Sections). */
export interface HomeSectionItem {
  id: number;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  style: string | null;
  tint: string | null;
  link_url: string | null;
  category_id: number | null;
  product_id: number | null;
  sort_order: number;
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
  items: HomeSectionItem[];
}

export type HomeSections = Record<string, HomeSection>;

/** Public product card (MySkin /storefront/products). */
export interface StoreProduct {
  id: number;
  public_id: string;
  name: string;
  selling_price: string | number;
  mrp: string | number | null;
  image_url: string | null;
  gallery_urls?: string[] | null;
  max_quantity?: number | null;
  description?: string | null;
  brand?: string | null;
  category_id?: number | null;
  rating_avg?: string | number;
  rating_count?: number;
  unit_value?: string | null;
  Category?: { id: number; name: string; slug: string } | null;
  Brand?: { id: number; name: string; slug: string } | null;
  variants?: StoreVariant[];
  ProductInventories?: { variant_id: number | null; quantity: number }[];
}

export interface StoreVariant {
  id: number;
  variant_name: string;
  selling_price: string | number;
  mrp: string | number | null;
  quantity: number;
  image_url: string | null;
}

/** Paged list as the public catalogue returns it (MySkin shape). */
export interface ProductPage {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: StoreProduct[];
}

export interface StoreBrand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  description?: string | null;
  product_count: number;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  brand?: string;
  brands?: string;
  search?: string;
  sort?: string;
  min_price?: number | string;
  max_price?: number | string;
}

export interface StoreReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  is_verified: boolean;
  helpful_count: number;
  voted_helpful: boolean;
  mine: boolean;
  author: string;
  created_at: string | null;
  status?: string;
}

export interface ReviewSummary {
  average: number;
  ratings: number;
  reviews: number;
  with_photos: number;
  distribution: Record<string, number>;
}

export interface ReviewPage {
  summary: ReviewSummary;
  total: number;
  page: number;
  total_pages: number;
  data: StoreReview[];
}
