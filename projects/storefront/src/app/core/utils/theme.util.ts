import { StoreTheme } from '../models/storefront.model';

// Applies the tenant theme as the MySkin CSS variables on <html> (styles/_tokens.scss),
// so the Classic template follows the colours picked in the wizard. From myskin_web ThemeService.

const RADIUS: Record<string, string> = { pill: '9999px', rounded: '10px', square: '3px' };
const HEX = /^#[0-9a-f]{6}$/i;

/** Mixes a hex colour toward black (amount < 0) or white (amount > 0), amount in -1..1. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * p).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function applyClassicTheme(t: StoreTheme): void {
  if (!HEX.test(t?.primary || '') || !HEX.test(t?.primary_dark || '')) return;
  const root = document.documentElement;
  const set = (name: string, value: string) => root.style.setProperty(name, value);
  const deep = shade(t.primary_dark, -0.25);
  const solid = t.button_style !== 'gradient';
  const background = HEX.test(t.background || '') ? t.background : '#ffffff';

  set('--brand-primary', t.primary);
  set('--brand-dark', t.primary_dark);
  set('--brand-deep', deep);
  set('--brand-wine', shade(t.primary_dark, -0.35));
  set('--brand-light', t.tint);
  set('--brand-soft', t.soft);
  set('--brand-bg', background);
  set('--bg-page', background);
  set('--bg-alt', t.soft);
  set('--border', shade(t.tint, -0.04));
  set('--border-light', shade(t.tint, 0.4));
  set('--hairline', shade(t.tint, -0.04));
  set('--text-primary', t.text);
  set('--ink', t.text);
  set('--header-bg', HEX.test(t.header || '') ? t.header : '#ffffff');
  set('--bg-dark', t.footer);
  set('--brand-gradient', solid
    ? `linear-gradient(135deg, ${t.primary} 0%, ${t.primary} 100%)`
    : `linear-gradient(135deg, ${t.primary} 0%, ${t.primary_dark} 100%)`);
  set('--brand-gradient-hover', solid
    ? `linear-gradient(135deg, ${t.primary_dark} 0%, ${t.primary_dark} 100%)`
    : `linear-gradient(135deg, ${shade(t.primary, -0.12)} 0%, ${shade(t.primary_dark, -0.15)} 100%)`);
  set('--brand-gradient-banner', `radial-gradient(circle at 72% 38%, ${shade(t.primary, 0.06)} 0%, ${shade(t.primary, -0.18)} 48%, ${deep} 100%)`);
  set('--shadow-brand', `0 8px 20px ${rgba(t.primary, 0.28)}`);
  set('--shadow-sm', `0 1px 3px ${rgba(t.primary_dark, 0.08)}`);
  set('--shadow', `0 6px 20px ${rgba(t.primary_dark, 0.12)}`);
  set('--shadow-lg', `0 14px 40px ${rgba(t.primary_dark, 0.18)}`);
  set('--btn-radius', RADIUS[t.button_shape] || RADIUS['pill']);
  root.dataset['btnStyle'] = t.button_style;
}
