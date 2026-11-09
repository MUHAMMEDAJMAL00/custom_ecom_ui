// Electro template content: starter visuals shown until the shop adds its own banners
// and Home Sections cards (Website → Home Banners / Home Sections). Images: Unsplash.

import { HomeLink } from '../classic/classic-content';

export function unsplash(id: string, width = 600, height?: number): string {
  const size = height ? `&h=${height}` : '';
  return `https://images.unsplash.com/${id}?w=${width}${size}&q=80&auto=format&fit=crop`;
}

export interface ElectroSlide extends HomeLink {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  image: string;
}

export interface ElectroTile extends HomeLink {
  eyebrow: string;
  title: string;
  note: string;
  image: string;
}

export interface ElectroService {
  icon: string;
  title: string;
  note: string;
}

export const ELECTRO_SLIDES: ElectroSlide[] = [
  {
    eyebrow: 'New season tech',
    title: 'Smarter gadgets for every day',
    text: 'Phones, laptops, audio and wearables from the brands you trust.',
    cta: 'Shop now',
    image: unsplash('photo-1498049794561-7780e7231661', 1400, 700),
    keywords: [],
  },
  {
    eyebrow: 'Big screen deals',
    title: 'Bring the cinema home',
    text: 'Smart TVs, consoles and sound for the whole family.',
    cta: 'Explore TVs',
    image: unsplash('photo-1593359677879-a4bb92f829d1', 1400, 700),
    keywords: ['tv', 'entertainment', 'television'],
  },
];

export const ELECTRO_TILES: ElectroTile[] = [
  { eyebrow: 'Up to 30% off', title: 'Audio & Headphones', note: 'Wireless, noise cancelling', image: unsplash('photo-1505740420928-5e560c06d30e', 600, 400), keywords: ['audio', 'headphone', 'sound'] },
  { eyebrow: 'Bright ideas', title: 'Lighting', note: 'LED lamps and fittings', image: unsplash('photo-1513506003901-1e6a229e2d15', 600, 400), keywords: ['light', 'lamp'] },
];

export const ELECTRO_SERVICES: ElectroService[] = [
  { icon: 'bi-truck', title: 'Free delivery', note: 'On orders above 999' },
  { icon: 'bi-shield-check', title: '1-year warranty', note: 'On all electronics' },
  { icon: 'bi-credit-card', title: 'Secure payment', note: 'Cards, UPI and wallets' },
  { icon: 'bi-headset', title: 'Expert support', note: 'Help choosing the right product' },
];

export const ELECTRO_PROMO = {
  eyebrow: 'Upgrade your home',
  title: 'Smart Home Week',
  highlight: 'Up to 40% OFF on smart devices',
  cta: 'Shop smart home',
  image: unsplash('photo-1558002038-1055907df827', 900, 600),
};

/** Category tile image when a category has none: matched by name. */
export const CATEGORY_IMAGES: { keywords: string[]; image: string }[] = [
  { keywords: ['mobile', 'phone', 'tablet'], image: unsplash('photo-1511707171634-5f897ff02aa9', 300, 300) },
  { keywords: ['laptop', 'computer', 'pc'], image: unsplash('photo-1517336714731-489689fd1ca8', 300, 300) },
  { keywords: ['audio', 'headphone', 'speaker', 'sound'], image: unsplash('photo-1505740420928-5e560c06d30e', 300, 300) },
  { keywords: ['wear', 'watch'], image: unsplash('photo-1546868871-7041f2a55e12', 300, 300) },
  { keywords: ['tv', 'entertainment', 'gaming'], image: unsplash('photo-1593359677879-a4bb92f829d1', 300, 300) },
  { keywords: ['smart home', 'smart'], image: unsplash('photo-1558002038-1055907df827', 300, 300) },
  { keywords: ['light', 'lamp'], image: unsplash('photo-1513506003901-1e6a229e2d15', 300, 300) },
  { keywords: ['kitchen', 'appliance'], image: unsplash('photo-1556911220-bff31c812dba', 300, 300) },
  { keywords: ['electrical', 'wiring', 'switch', 'cable'], image: unsplash('photo-1621905251189-08b45d6a269e', 300, 300) },
];

export function categoryImageFor(name: string): string {
  const lower = name.toLowerCase();
  return (
    CATEGORY_IMAGES.find((c) => c.keywords.some((k) => lower.includes(k)))?.image ??
    unsplash('photo-1550009158-9ebf69173e03', 300, 300)
  );
}
