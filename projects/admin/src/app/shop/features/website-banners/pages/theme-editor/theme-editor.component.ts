import { storefrontLink } from '../../../../core/utils/shop-url';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../../environments/environment';

export interface StoreTheme {
  primary: string;
  primary_dark: string;
  tint: string;
  soft: string;
  background: string;
  text: string;
  header: string;
  footer: string;
  button_shape: 'pill' | 'rounded' | 'square';
  button_style: 'gradient' | 'solid' | 'outline';
}

type ColorKey = 'primary' | 'primary_dark' | 'tint' | 'soft' | 'background' | 'header' | 'text' | 'footer';

/** Ready-made palettes; each sets all eight colours at once. */
const PRESETS: { name: string; colors: Pick<StoreTheme, ColorKey> }[] = [
  { name: 'Crimson', colors: { primary: '#c8102e', primary_dark: '#8b0a1e', tint: '#f9e4e7', soft: '#fdf4f5', background: '#ffffff', header: '#ffffff', text: '#2a1a20', footer: '#1b1d24' } },
  { name: 'Rose Gold', colors: { primary: '#b76e79', primary_dark: '#8a4f58', tint: '#f6e3e5', soft: '#fcf5f6', background: '#fffafa', header: '#ffffff', text: '#3a2a2d', footer: '#2b2224' } },
  { name: 'Berry', colors: { primary: '#a4135d', primary_dark: '#6e0b3e', tint: '#f7e1ec', soft: '#fdf3f8', background: '#fff7fb', header: '#ffffff', text: '#2b1622', footer: '#1e1219' } },
  { name: 'Emerald', colors: { primary: '#0f8a5f', primary_dark: '#0a5e41', tint: '#dcf2e9', soft: '#f2faf6', background: '#f7fcf9', header: '#ffffff', text: '#16261f', footer: '#14201b' } },
  { name: 'Royal Blue', colors: { primary: '#2346c8', primary_dark: '#162f8b', tint: '#e2e8fa', soft: '#f4f6fd', background: '#f8faff', header: '#ffffff', text: '#1a1f33', footer: '#151a2b' } },
  { name: 'Black & Gold', colors: { primary: '#1f1f1f', primary_dark: '#000000', tint: '#f3ecdc', soft: '#faf7f0', background: '#fffdf7', header: '#ffffff', text: '#1a1a1a', footer: '#0f0f0f' } },
];

const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'primary', label: 'Main colour', hint: 'Buttons, prices, links, badges' },
  { key: 'primary_dark', label: 'Dark shade', hint: 'Hover, gradients, banners' },
  { key: 'tint', label: 'Light tint', hint: 'Active menu items, chips' },
  { key: 'soft', label: 'Soft background', hint: 'Section and card backgrounds' },
  { key: 'background', label: 'Page background', hint: 'Whole website background' },
  { key: 'header', label: 'Header', hint: 'Top menu bar background (keep it light)' },
  { key: 'text', label: 'Text', hint: 'Headings and body text' },
  { key: 'footer', label: 'Footer', hint: 'Footer background' },
];

function shade(hex: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  const ch = (v: number) => Math.round(v + (target - v) * p).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

/** Website → Theme: the storefront's colours, page background and button style. */
@Component({
  selector: 'app-theme-editor',
  standalone: false,
  templateUrl: './theme-editor.component.html',
  styleUrls: ['../banner-list/banner-list.component.css', './theme-editor.component.css'],
})
export class ThemeEditorComponent implements OnInit {
  readonly presets = PRESETS;
  readonly colorFields = COLOR_FIELDS;
  readonly storefrontUrl = storefrontLink(environment.storefrontUrl, '', environment.production, environment.rootDomain);

  theme: StoreTheme | null = null;
  defaults: StoreTheme | null = null;
  private saved = '';
  loading = true;
  saving = false;
  errorMessage = '';

  /** The signed-in shop's name, for the live preview header and footer. */
  readonly shopName = JSON.parse(localStorage.getItem('tenant.session') || '{}')?.tenant?.name || 'Your shop';

  constructor(private api: ApiService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<StoreTheme>('/home-sections/theme').pipe(map((res: any) => res)).subscribe({
      next: (res: any) => {
        // Fill colours an older saved theme (or backend) doesn't have yet.
        this.defaults = { ...PRESETS[0].colors, ...res.defaults };
        this.theme = { ...this.defaults, ...res.data };
        this.saved = JSON.stringify(this.theme);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load the theme.';
      },
    });
  }

  get dirty(): boolean {
    return !!this.theme && JSON.stringify(this.theme) !== this.saved;
  }

  isValid(hex: string): boolean {
    return /^#[0-9a-f]{6}$/i.test(hex || '');
  }

  get allValid(): boolean {
    return !!this.theme && this.colorFields.every((f) => this.isValid(this.theme![f.key]));
  }

  setColor(key: ColorKey, value: string): void {
    if (!this.theme) return;
    this.theme = { ...this.theme, [key]: value.trim().toLowerCase() };
  }

  /** Picking a main colour also suggests matching shades (all still editable). */
  setMain(value: string): void {
    if (!this.theme || !this.isValid(value)) {
      this.setColor('primary', value);
      return;
    }
    this.theme = {
      ...this.theme,
      primary: value.toLowerCase(),
      primary_dark: shade(value, -0.32),
      tint: shade(value, 0.86),
      soft: shade(value, 0.95),
    };
  }

  applyPreset(p: (typeof PRESETS)[number]): void {
    if (!this.theme) return;
    this.theme = { ...this.theme, ...p.colors };
  }

  isPreset(p: (typeof PRESETS)[number]): boolean {
    return !!this.theme && (Object.keys(p.colors) as ColorKey[]).every((k) => this.theme![k] === p.colors[k]);
  }

  setShape(shape: StoreTheme['button_shape']): void {
    if (this.theme) this.theme = { ...this.theme, button_shape: shape };
  }

  setStyle(style: StoreTheme['button_style']): void {
    if (this.theme) this.theme = { ...this.theme, button_style: style };
  }

  resetToDefault(): void {
    if (this.defaults) this.theme = { ...this.defaults };
  }

  discard(): void {
    this.theme = JSON.parse(this.saved);
  }

  save(): void {
    if (!this.theme || !this.allValid) {
      this.notify.warning('Every colour must look like #c8102e');
      return;
    }
    this.saving = true;
    this.api.put<StoreTheme>('/home-sections/theme', this.theme).subscribe({
      next: (res) => {
        this.saving = false;
        // An outdated backend silently drops fields it doesn't know — say so instead of pretending it saved.
        const dropped = this.colorFields.filter((f) => !(res.data as any)?.[f.key]).map((f) => f.label);
        if (dropped.length) {
          this.notify.warning(`Server did not save: ${dropped.join(', ')}. Restart the backend and save again.`);
          return; // keep the edits (still unsaved) so they can be saved again
        }
        this.theme = { ...this.defaults!, ...res.data };
        this.saved = JSON.stringify(this.theme);
        this.notify.success('Theme saved — the website shows it on the next page load');
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  /** CSS variables for the live preview, computed like the storefront does. */
  get previewVars(): Record<string, string> {
    const t = this.theme!;
    const solid = t.button_style !== 'gradient';
    const radius = { pill: '999px', rounded: '10px', square: '3px' }[t.button_shape];
    return {
      '--pv-primary': t.primary,
      '--pv-dark': t.primary_dark,
      '--pv-tint': t.tint,
      '--pv-soft': t.soft,
      '--pv-bg': t.background,
      '--pv-text': t.text,
      '--pv-header': t.header,
      '--pv-footer': t.footer,
      '--pv-radius': radius,
      '--pv-btn': solid ? t.primary : `linear-gradient(135deg, ${t.primary}, ${t.primary_dark})`,
      '--pv-banner': `radial-gradient(circle at 72% 38%, ${shade(t.primary, 0.06)} 0%, ${shade(t.primary, -0.18)} 48%, ${shade(t.primary_dark, -0.25)} 100%)`,
    };
  }
}
