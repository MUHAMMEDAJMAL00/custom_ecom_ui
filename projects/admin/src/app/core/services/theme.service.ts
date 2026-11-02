import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'light' | 'dark';
export type AccentKey = 'crimson' | 'blue' | 'emerald' | 'violet' | 'amber';

export interface AccentOption {
  key: AccentKey;
  label: string;
  color: string;
}

const MODE_KEY = 'platform.theme.mode';
const ACCENT_KEY = 'platform.theme.accent';
const CUSTOM_KEY = 'platform.theme.custom';

const ACCENTS: AccentOption[] = [
  { key: 'crimson', label: 'Crimson', color: '#c8102e' },
  { key: 'blue', label: 'Ocean', color: '#2563eb' },
  { key: 'emerald', label: 'Emerald', color: '#059669' },
  { key: 'violet', label: 'Violet', color: '#7c3aed' },
  { key: 'amber', label: 'Amber', color: '#d97706' },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly accentOptions = ACCENTS;

  private readonly modeSubject = new BehaviorSubject<ThemeMode>(this.readMode());
  private readonly accentSubject = new BehaviorSubject<AccentKey>(this.readAccent());
  private readonly customActiveSubject = new BehaviorSubject<boolean>(this.readCustomActive());
  private readonly customColorSubject = new BehaviorSubject<string>(
    this.readCustomColor() || this.presetColor(this.readAccent()),
  );
  private customColor = this.readCustomColor();

  readonly mode$ = this.modeSubject.asObservable();
  readonly accent$ = this.accentSubject.asObservable();
  readonly customActive$ = this.customActiveSubject.asObservable();
  readonly customColor$ = this.customColorSubject.asObservable();

  constructor() {
    this.apply(this.modeSubject.value, this.accentSubject.value);
  }

  setMode(mode: ThemeMode): void {
    this.modeSubject.next(mode);
    this.apply(mode, this.accentSubject.value);
  }

  setAccent(accent: AccentKey): void {
    this.accentSubject.next(accent);
    this.customColor = '';
    this.customActiveSubject.next(false);
    this.customColorSubject.next(this.presetColor(accent));
    this.apply(this.modeSubject.value, accent);
  }

  setCustomColor(color: string): void {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;

    this.customColor = color;
    this.customActiveSubject.next(true);
    this.customColorSubject.next(color);
    this.apply(this.modeSubject.value, this.accentSubject.value);
  }

  private apply(mode: ThemeMode, accent: AccentKey): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-accent', accent);
    this.clearCustomProperties(root);

    if (this.customColor) {
      const tintBase = mode === 'dark' ? '#111827' : '#ffffff';
      root.style.setProperty('--brand', this.customColor);
      root.style.setProperty('--brand-dark', `color-mix(in srgb, ${this.customColor} 82%, black)`);
      root.style.setProperty('--brand-darker', `color-mix(in srgb, ${this.customColor} 68%, black)`);
      root.style.setProperty('--brand-mid', `color-mix(in srgb, ${this.customColor} 88%, white)`);
      root.style.setProperty('--brand-light', `color-mix(in srgb, ${this.customColor} 45%, white)`);
      root.style.setProperty('--brand-tint', `color-mix(in srgb, ${this.customColor} 14%, ${tintBase})`);
      root.style.setProperty('--brand-tint-2', `color-mix(in srgb, ${this.customColor} 6%, ${tintBase})`);
      root.style.setProperty('--accent', `color-mix(in srgb, ${this.customColor} 82%, black)`);
    }

    try {
      localStorage.setItem(MODE_KEY, mode);
      localStorage.setItem(ACCENT_KEY, accent);
      if (this.customColor) {
        localStorage.setItem(CUSTOM_KEY, this.customColor);
      } else {
        localStorage.removeItem(CUSTOM_KEY);
      }
    } catch {
      // Storage can be blocked; the in-memory theme still applies.
    }
  }

  private clearCustomProperties(root: HTMLElement): void {
    const brandProperties = [
      '--brand',
      '--brand-dark',
      '--brand-darker',
      '--brand-mid',
      '--brand-light',
      '--brand-tint',
      '--brand-tint-2',
      '--accent',
    ];
    for (const property of brandProperties) root.style.removeProperty(property);
  }

  private presetColor(accent: AccentKey): string {
    return ACCENTS.find((option) => option.key === accent)?.color || '#c8102e';
  }

  private readMode(): ThemeMode {
    try {
      return localStorage.getItem(MODE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private readAccent(): AccentKey {
    try {
      const saved = localStorage.getItem(ACCENT_KEY) as AccentKey | null;
      return ACCENTS.some((option) => option.key === saved) ? (saved as AccentKey) : 'crimson';
    } catch {
      return 'crimson';
    }
  }

  private readCustomColor(): string {
    try {
      const saved = localStorage.getItem(CUSTOM_KEY) || '';
      return /^#[0-9a-f]{6}$/i.test(saved) ? saved : '';
    } catch {
      return '';
    }
  }

  private readCustomActive(): boolean {
    return Boolean(this.readCustomColor());
  }
}
