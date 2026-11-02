// Classic template content — copied from myskin_web features/home/home-content.ts.
// The Classic home renders the tenant's own Home Sections, banners and categories;
// these arrays are the starter visuals shown until the shop adds its own cards
// (Website → Home Sections), exactly as the MySkin home does.

/** Unsplash CDN url for a photo id, sized for its slot. */
export function unsplash(id: string, width = 600, height?: number): string {
  const size = height ? `&h=${height}` : '';
  return `https://images.unsplash.com/${id}?w=${width}${size}&q=80&auto=format&fit=crop`;
}

/** Category keywords match the shop's category names; see findCategoryByKeywords. */
export interface HomeLink {
  keywords?: string[];
  anchor?: string;
  /** Set when the target is a known category id (admin-managed banners). */
  categoryId?: number;
  /** Free-text link from the admin app, e.g. /catalog/category/skincare or https://… */
  url?: string;
}

export interface HeroSlide extends HomeLink {
  eyebrow: string;
  title: string;
  titleLine2: string;
  text: string;
  cta: string;
  script: string;
  model: string;
  products: string;
}

export interface OfferStrip {
  /** Stable id from the API (used for rendering/tracking) */
  id?: string;
  icon: string;
  badge?: string;
  title: string;
  highlight: string;
  note: string;
  /** Coupon this banner advertises */
  code?: string;
  /** Page listing the offer's products (product, category or /catalog/offer/<id>) */
  link?: string[];
}

export interface CategoryTile extends HomeLink {
  name: string;
  image: string;
}

export interface DealCard extends HomeLink {
  eyebrow: string;
  value: string;
  label: string;
  image: string;
  style: 'round' | 'wide' | 'model';
}

export interface PackCard extends HomeLink {
  title: string;
  subtitle: string;
  image: string;
  tint: string;
}

export interface BrandCard extends HomeLink {
  name: string;
  offer: string;
  note: string;
  image: string;
}

export interface ValueItem extends HomeLink {
  name: string;
  price: string;
  image: string;
}

export interface LuxeCard extends HomeLink {
  title: string;
  subtitle: string;
  image: string;
}

export interface LuxePerk {
  icon: string;
  title: string;
  note: string;
}

export interface StoryLink extends HomeLink {
  label: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    eyebrow: 'Look Good',
    title: 'Real Beauty',
    titleLine2: 'For Every You',
    text: 'Discover your unique beauty with premium skincare, makeup & more.',
    cta: 'Shop Now',
    script: 'Glow Naturally',
    model: unsplash('photo-1519699047748-de8e457a634e', 700, 760),
    products: unsplash('photo-1629198688000-71f23e745b6e', 520, 520),
    keywords: ['skin'],
  },
  {
    eyebrow: 'New Season',
    title: 'Makeup That',
    titleLine2: 'Loves Your Skin',
    text: 'Long-wear lips, flawless bases and palettes made for every tone.',
    cta: 'Explore Makeup',
    script: 'Be Bold',
    model: unsplash('photo-1487412947147-5cebf100ffc2', 700, 760),
    products: unsplash('photo-1522335789203-aabd1fc54bc9', 520, 520),
    keywords: ['makeup', 'make up', 'cosmetic'],
  },
  {
    eyebrow: 'Signature Scents',
    title: 'Fragrance',
    titleLine2: 'Worth Remembering',
    text: 'Iconic perfumes and fresh mists to finish every look.',
    cta: 'Shop Fragrance',
    script: 'Feel Luxe',
    model: unsplash('photo-1494790108377-be9c29b29330', 700, 760),
    products: unsplash('photo-1594035910387-fea47794261f', 520, 520),
    keywords: ['fragrance', 'perfume'],
  },
];

export const OFFER_STRIPS: OfferStrip[] = [
  { icon: 'bi-credit-card-2-front', badge: 'VISA', title: 'Extra 10% OFF', highlight: 'Up to 12 months', note: 'with selected credit cards' },
  { icon: 'bi-gift', title: 'Extra 15% OFF', highlight: 'Code: NEW15', note: 'On first order above ₹999', code: 'NEW15' },
];

export const CATEGORY_TILES: CategoryTile[] = [
  { name: 'Makeup', image: unsplash('photo-1512496015851-a90fb38ba796', 240, 240), keywords: ['makeup', 'make up', 'cosmetic'] },
  { name: 'Skincare', image: unsplash('photo-1601049541289-9b1b7bbbfe19', 240, 240), keywords: ['skin'] },
  { name: 'Hair', image: unsplash('photo-1527799820374-dcf8d9d4a388', 240, 240), keywords: ['hair'] },
  { name: 'Fragrance', image: unsplash('photo-1541643600914-78b084683601', 240, 240), keywords: ['fragrance', 'perfume'] },
  { name: 'Bath & Body', image: unsplash('photo-1526947425960-945c6e72858f', 240, 240), keywords: ['bath', 'body'] },
  { name: 'Wellness', image: unsplash('photo-1544161515-4ab6ce6db874', 240, 240), keywords: ['wellness', 'health'] },
  { name: 'Gifting', image: unsplash('photo-1549465220-1a8b9238cd48', 240, 240), keywords: ['gift'] },
  { name: 'Men', image: unsplash('photo-1621607512214-68297480165e', 240, 240), keywords: ['men', 'groom'] },
];

export const DEAL_CARDS: DealCard[] = [
  { eyebrow: 'Min', value: '20% OFF', label: 'On Selected Skincare', image: unsplash('photo-1576426863848-c21f53c60b19', 320, 320), style: 'round', keywords: ['skin'] },
  { eyebrow: 'Up to', value: '40% OFF', label: 'On Makeup Essentials', image: unsplash('photo-1583241800698-e8ab01830a07', 320, 320), style: 'round', keywords: ['makeup', 'make up', 'cosmetic'] },
  { eyebrow: 'Up to', value: '60% OFF', label: 'On Premium Brands', image: unsplash('photo-1612817288484-6f916006741a', 520, 340), style: 'wide', anchor: 'brands' },
  { eyebrow: 'Glow', value: 'Naturally', label: 'With Our Best Sellers', image: unsplash('photo-1531746020798-e6953c6e8e04', 520, 400), style: 'model', anchor: 'value' },
];

export const PACK_CARDS: PackCard[] = [
  { title: 'Glow & Radiate', subtitle: 'Festive Pack', image: unsplash('photo-1599847935464-fde3827639c2', 480, 340), tint: '#fde3e3', keywords: ['skin'] },
  { title: 'Brighten Beauty', subtitle: 'Festive Pack', image: unsplash('photo-1596462502278-27bfdc403348', 480, 340), tint: '#fbe4f1', keywords: ['makeup', 'make up', 'cosmetic'] },
  { title: 'Hair Care Magic', subtitle: 'Festive Pack', image: unsplash('photo-1535585209827-a15fcdbc4c2d', 480, 340), tint: '#e3ecfb', keywords: ['hair'] },
  { title: 'Self Care Delight', subtitle: 'Festive Pack', image: unsplash('photo-1611930022073-b7a4ba5fcccd', 480, 340), tint: '#fdeadf', keywords: ['bath', 'body', 'wellness'] },
];

export const BRAND_CARDS: BrandCard[] = [
  { name: 'Glow Edit', offer: 'Up to 50% OFF', note: 'On glow essentials', image: unsplash('photo-1522335789203-aabd1fc54bc9', 260, 260), keywords: ['makeup', 'make up'] },
  { name: 'Daily Essentials', offer: 'Up to 40% OFF', note: 'On daily skincare', image: unsplash('photo-1598440947619-2c35fc9aa908', 260, 260), keywords: ['skin'] },
  { name: 'Luxe Line', offer: 'Up to 45% OFF', note: 'On luxe makeup', image: unsplash('photo-1522338242992-e1a54906a8da', 260, 260), keywords: ['makeup', 'make up'] },
  { name: 'Care Studio', offer: 'Up to 45% OFF', note: 'On body care', image: unsplash('photo-1631729371254-42c2892f0e6e', 260, 260), keywords: ['bath', 'body'] },
  { name: 'Exclusives', offer: 'Up to 50% OFF', note: 'On exclusive picks', image: unsplash('photo-1608979048467-6194dabc6a3d', 260, 260), keywords: ['fragrance', 'perfume'] },
];

export const VALUE_FALLBACK: ValueItem[] = [
  { name: 'Winter Specials', price: 'Under ₹499', image: unsplash('photo-1620916566398-39f1143ab7be', 240, 240), keywords: ['skin'] },
  { name: 'Eyeshadow', price: 'Under ₹599', image: unsplash('photo-1515688594390-b649af70d282', 240, 240), keywords: ['makeup'] },
  { name: 'Lipstick', price: 'Under ₹399', image: unsplash('photo-1586495777744-4413f21062fa', 240, 240), keywords: ['makeup'] },
  { name: 'Matte Lips', price: 'Under ₹449', image: unsplash('photo-1580618672591-eb180b1a973f', 240, 240), keywords: ['makeup'] },
  { name: 'Hair Tools', price: 'Under ₹999', image: unsplash('photo-1522337094846-8a818192de1f', 240, 240), keywords: ['hair'] },
  { name: 'Brush Sets', price: 'Under ₹699', image: unsplash('photo-1526045478516-99145907023c', 240, 240), keywords: ['makeup'] },
  { name: 'Eye Cream', price: 'Under ₹599', image: unsplash('photo-1570172619644-dfd03ed5d881', 240, 240), keywords: ['skin'] },
  { name: 'Face Oil Drops', price: 'Under ₹799', image: unsplash('photo-1608571423902-eed4a5ad8108', 240, 240), keywords: ['skin'] },
  { name: 'Body Creams', price: 'Under ₹499', image: unsplash('photo-1556229010-6c3f2c9ca5f8', 240, 240), keywords: ['body'] },
  { name: 'Toners', price: 'Under ₹449', image: unsplash('photo-1629198688000-71f23e745b6e', 240, 240), keywords: ['skin'] },
  { name: 'Top Picks', price: 'Under ₹899', image: unsplash('photo-1592945403244-b3fbafd7f539', 240, 240), keywords: ['fragrance', 'perfume'] },
  { name: 'Lip Colour', price: 'Under ₹349', image: unsplash('photo-1588516903720-8ceb67f9ef84', 240, 240), keywords: ['makeup'] },
];

export const LUXE_CARDS: LuxeCard[] = [
  { title: 'Your Perfect', subtitle: 'Skincare Companion', image: unsplash('photo-1570172619644-dfd03ed5d881', 640, 440), keywords: ['skin'] },
  { title: 'Glow 100%', subtitle: 'Luxury Skincare', image: unsplash('photo-1617897903246-719242758050', 640, 440), keywords: ['skin'] },
  { title: 'Look Flawless Everyday', subtitle: 'Makeup Collection', image: unsplash('photo-1524504388940-b1c1722653e1', 640, 440), keywords: ['makeup', 'make up'] },
];

export const LUXE_PERKS: LuxePerk[] = [
  { icon: 'bi-truck', title: 'Free Shipping', note: 'On orders ₹999+' },
  { icon: 'bi-arrow-repeat', title: 'Easy Returns', note: 'Within 30 days' },
  { icon: 'bi-patch-check', title: '100% Authentic', note: 'Products' },
  { icon: 'bi-shield-lock', title: 'Secure Payment', note: 'SSL encrypted' },
  { icon: 'bi-stars', title: 'Beauty Rewards', note: 'Earn points' },
];

export const STORY_LINKS: StoryLink[] = [
  { label: 'This Glow Season', keywords: ['skin'] },
  { label: 'New Arrivals', anchor: 'value' },
  { label: 'The Gift Store', keywords: ['gift'] },
  { label: 'Glam Hub', keywords: ['makeup', 'make up'] },
  { label: 'Look Beauty', keywords: ['fragrance', 'perfume'] },
];

export const TRENDING = {
  title: 'Trending Appliances',
  subtitle: 'This Way',
  offer: 'Up to 45% OFF',
  keywords: ['hair'],
  images: [
    unsplash('photo-1522337094846-8a818192de1f', 300, 300),
    unsplash('photo-1560869713-7d0a29430803', 300, 300),
    unsplash('photo-1522337360788-8b13dee7a37e', 300, 300),
  ],
};

export const CONNECT_PHOTOS = [
  unsplash('photo-1515377905703-c4788e51af15', 400, 300),
  unsplash('photo-1487412947147-5cebf100ffc2', 400, 300),
  unsplash('photo-1612817288484-6f916006741a', 400, 300),
  unsplash('photo-1438761681033-6461ffad8d80', 400, 300),
];

export const SOCIALS = [
  { icon: 'bi-instagram', label: 'Instagram', url: 'https://instagram.com' },
  { icon: 'bi-facebook', label: 'Facebook', url: 'https://facebook.com' },
  { icon: 'bi-youtube', label: 'YouTube', url: 'https://youtube.com' },
  { icon: 'bi-twitter-x', label: 'X', url: 'https://x.com' },
];
