import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ModuleGroup, PlatformModule } from '../../../core/models/platform-module.model';
import {
  CreateTenantPayload,
  CreatedInvite,
  ProvisionedTenant,
  ProvisioningRun,
  ProvisioningStep,
  ProvisioningStepStatus,
  TenantCreateResult,
  ThemeValues,
} from '../../../core/models/provisioning.model';
import { ApiService } from '../../../core/services/api.service';

type ColorKey =
  | 'primary'
  | 'primary_dark'
  | 'tint'
  | 'soft'
  | 'background'
  | 'text'
  | 'header'
  | 'footer';

interface SlugCheck {
  slug: string;
  available: boolean;
  reason: string | null;
}

interface TenantFormControls {
  name: FormControl<string>;
  slug: FormControl<string>;
  legal_name: FormControl<string>;
  gstin: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  currency: FormControl<string>;
  timezone: FormControl<string>;
  locale: FormControl<string>;
  logo_url: FormControl<string>;

  layout_template: FormControl<string>;
  primary: FormControl<string>;
  primary_dark: FormControl<string>;
  tint: FormControl<string>;
  soft: FormControl<string>;
  background: FormControl<string>;
  text: FormControl<string>;
  header: FormControl<string>;
  footer: FormControl<string>;
  button_shape: FormControl<'pill' | 'rounded' | 'square'>;
  button_style: FormControl<'gradient' | 'solid' | 'outline'>;

  owner_name: FormControl<string>;
  owner_email: FormControl<string>;
  owner_phone: FormControl<string>;
  owner_mode: FormControl<'invite' | 'password'>;
  owner_password: FormControl<string>;

  subdomain: FormControl<string>;
  custom_domain: FormControl<string>;
}

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const DOMAIN_PATTERN = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const DEFAULT_THEME: ThemeValues = {
  primary: '#c8102e',
  primary_dark: '#8b0a1e',
  tint: '#f9e4e7',
  soft: '#fdf4f5',
  background: '#ffffff',
  text: '#2a1a20',
  header: '#ffffff',
  footer: '#1b1d24',
  button_shape: 'pill',
  button_style: 'gradient',
};

const PRESETS: { name: string; colors: Record<ColorKey, string> }[] = [
  {
    name: 'Crimson',
    colors: {
      primary: '#c8102e', primary_dark: '#8b0a1e', tint: '#f9e4e7', soft: '#fdf4f5',
      background: '#ffffff', text: '#2a1a20', header: '#ffffff', footer: '#1b1d24',
    },
  },
  {
    name: 'Rose Gold',
    colors: {
      primary: '#b76e79', primary_dark: '#8a4f58', tint: '#f6e3e5', soft: '#fcf5f6',
      background: '#fffafa', text: '#3a2a2d', header: '#ffffff', footer: '#2b2224',
    },
  },
  {
    name: 'Berry',
    colors: {
      primary: '#a4135d', primary_dark: '#6e0b3e', tint: '#f7e1ec', soft: '#fdf3f8',
      background: '#fff7fb', text: '#2b1622', header: '#ffffff', footer: '#1e1219',
    },
  },
  {
    name: 'Emerald',
    colors: {
      primary: '#0f8a5f', primary_dark: '#0a5e41', tint: '#dcf2e9', soft: '#f2faf6',
      background: '#f7fcf9', text: '#16261f', header: '#ffffff', footer: '#14201b',
    },
  },
  {
    name: 'Royal Blue',
    colors: {
      primary: '#2346c8', primary_dark: '#162f8b', tint: '#e2e8fa', soft: '#f4f6fd',
      background: '#f8faff', text: '#1a1f33', header: '#ffffff', footer: '#151a2b',
    },
  },
  {
    name: 'Black & Gold',
    colors: {
      primary: '#1f1f1f', primary_dark: '#000000', tint: '#f3ecdc', soft: '#faf7f0',
      background: '#fffdf7', text: '#1a1a1a', header: '#ffffff', footer: '#0f0f0f',
    },
  },
];

const COLOR_FIELDS: { key: ColorKey; label: string; hint: string }[] = [
  { key: 'primary', label: 'Main colour', hint: 'Buttons, prices, links' },
  { key: 'primary_dark', label: 'Dark shade', hint: 'Hover and gradients' },
  { key: 'tint', label: 'Light tint', hint: 'Chips and active items' },
  { key: 'soft', label: 'Soft background', hint: 'Cards and sections' },
  { key: 'background', label: 'Page background', hint: 'Whole website' },
  { key: 'text', label: 'Text', hint: 'Headings and body' },
  { key: 'header', label: 'Header', hint: 'Top menu bar' },
  { key: 'footer', label: 'Footer', hint: 'Footer background' },
];

const CURRENCIES = ['INR', 'USD', 'AED', 'GBP', 'EUR', 'SGD'];
const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'UTC',
  'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
];
const LOCALES = ['en-IN', 'en-US', 'en-GB', 'en-AE', 'en-SG', 'de-DE'];
const LAYOUTS = [
  { key: 'classic', name: 'Classic', text: 'Full storefront layout with hero banners, sections, and category rows.' },
  { key: 'minimal', name: 'Minimal', text: 'Clean hero, featured products, and a short category row.' },
];

@Component({
  selector: 'app-tenant-create',
  standalone: false,
  templateUrl: './tenant-create.component.html',
  styleUrls: ['./tenant-create.component.scss'],
})
export class TenantCreateComponent implements OnInit {
  readonly steps = [
    { label: 'Profile', hint: 'Shop details and contact' },
    { label: 'Design', hint: 'Layout and colours' },
    { label: 'Modules', hint: 'Features this shop gets' },
    { label: 'Owner', hint: 'First admin account' },
    { label: 'Route', hint: 'Subdomain and domain' },
    { label: 'Review', hint: 'Confirm and create' },
  ];

  readonly currencies = CURRENCIES;
  readonly timezones = TIMEZONES;
  readonly locales = LOCALES;
  readonly layouts = LAYOUTS;
  readonly presets = PRESETS;
  readonly colorFields = COLOR_FIELDS;
  readonly rootDomain = environment.rootDomain;

  readonly form: FormGroup<TenantFormControls>;

  step = 1;
  maxReached = 1;

  slugTouched = false;
  autoSubdomain = true;
  slugStatus: 'idle' | 'checking' | 'available' | 'unavailable' | 'error' = 'idle';
  slugMessage = '';
  slugCheckedValue = '';

  subdomainStatus: 'idle' | 'checking' | 'available' | 'unavailable' | 'error' = 'idle';
  subdomainMessage = '';
  subdomainCheckedValue = '';

  modules: PlatformModule[] = [];
  groupedModules: ModuleGroup[] = [];
  selectedModules = new Set<string>();
  moduleLoading = true;
  moduleError = '';
  moduleNotice = '';
  moduleWarning = '';

  submitting = false;
  retrying = false;
  submitError = '';

  result: TenantCreateResult | null = null;

  constructor(
    private fb: NonNullableFormBuilder,
    private api: ApiService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      slug: ['', [Validators.required, Validators.pattern(SLUG_PATTERN)]],
      legal_name: ['', [Validators.maxLength(200)]],
      gstin: ['', [Validators.pattern(GSTIN_PATTERN)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.maxLength(20)]],
      currency: ['INR', Validators.required],
      timezone: ['Asia/Kolkata', Validators.required],
      locale: ['en-IN', Validators.required],
      logo_url: ['', [Validators.maxLength(500)]],

      layout_template: ['classic', Validators.required],
      primary: [DEFAULT_THEME.primary, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      primary_dark: [DEFAULT_THEME.primary_dark, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      tint: [DEFAULT_THEME.tint, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      soft: [DEFAULT_THEME.soft, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      background: [DEFAULT_THEME.background, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      text: [DEFAULT_THEME.text, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      header: [DEFAULT_THEME.header, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      footer: [DEFAULT_THEME.footer, [Validators.required, Validators.pattern(HEX_PATTERN)]],
      button_shape: ['pill', Validators.required],
      button_style: ['gradient', Validators.required],

      owner_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      owner_email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      owner_phone: ['', [Validators.maxLength(20)]],
      owner_mode: ['invite', Validators.required],
      owner_password: [''],

      subdomain: ['', [Validators.required, Validators.pattern(SLUG_PATTERN)]],
      custom_domain: ['', [Validators.pattern(DOMAIN_PATTERN)]],
    }) as FormGroup<TenantFormControls>;
  }

  ngOnInit(): void {
    this.loadModules();
  }

  // ─── Navigation ────────────────────────────────────────────────────────────
  get progress(): number {
    return Math.round(((this.step - 1) / (this.steps.length - 1)) * 100);
  }

  get isCreated(): boolean {
    return this.result?.run.status === 'succeeded';
  }

  get isFailed(): boolean {
    return !!this.result && this.result.run.status === 'failed';
  }

  get currentStepValid(): boolean {
    return this.isStepValid(this.step);
  }

  isStepValid(step: number): boolean {
    const c = this.form.controls;
    switch (step) {
      case 1:
        return (
          c.name.valid && c.slug.valid && c.legal_name.valid && c.gstin.valid &&
          c.email.valid && c.phone.valid && c.logo_url.valid
        );
      case 2:
        return (
          c.layout_template.valid &&
          COLOR_FIELDS.every((field) => c[field.key].valid) &&
          c.button_shape.valid && c.button_style.valid
        );
      case 3:
        return true;
      case 4:
        return (
          c.owner_name.valid && c.owner_email.valid && c.owner_phone.valid &&
          (c.owner_mode.value === 'invite' || c.owner_password.valid)
        );
      case 5:
        return c.subdomain.valid && c.custom_domain.valid;
      case 6:
        return this.isStepValid(1) && this.isStepValid(2) && this.isStepValid(4) && this.isStepValid(5);
      default:
        return false;
    }
  }

  async next(): Promise<void> {
    this.moduleWarning = '';

    if (!this.isStepValid(this.step)) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.step === 1) {
      if (!this.form.controls.subdomain.value) {
        this.form.controls.subdomain.setValue(this.form.controls.slug.value);
      }
      const ok = await this.ensureSlugAvailable();
      if (!ok) return;
    }

    if (this.step === 5) {
      const ok = await this.ensureSubdomainAvailable();
      if (!ok) return;
    }

    if (this.step < this.steps.length) {
      this.step += 1;
      this.maxReached = Math.max(this.maxReached, this.step);
      this.scrollToTop();
    }
  }

  back(): void {
    if (this.step > 1) {
      this.step -= 1;
      this.scrollToTop();
    }
  }

  goToStep(step: number): void {
    if (step > this.maxReached || step === this.step) return;
    this.step = step;
    this.moduleWarning = '';
    this.scrollToTop();
  }

  isInvalid(name: keyof TenantFormControls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  requiresLabel(mod: PlatformModule): string {
    return mod.depends_on.map((key) => this.moduleLabel(key)).join(', ');
  }

  // ─── Profile ───────────────────────────────────────────────────────────────
  onNameInput(): void {
    if (this.slugTouched) return;
    const slug = this.slugify(this.form.controls.name.value);
    this.form.controls.slug.setValue(slug);
    if (this.autoSubdomain) this.form.controls.subdomain.setValue(slug);
    this.resetSlugCheck();
  }

  onSlugInput(): void {
    this.slugTouched = true;
    const normalized = this.slugify(this.form.controls.slug.value);
    if (normalized !== this.form.controls.slug.value) {
      this.form.controls.slug.setValue(normalized);
    }
    if (this.autoSubdomain) this.form.controls.subdomain.setValue(normalized);
    this.resetSlugCheck();
    this.resetSubdomainCheck();
  }

  onSubdomainInput(): void {
    this.autoSubdomain = false;
    const normalized = this.form.controls.subdomain.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    if (normalized !== this.form.controls.subdomain.value) {
      this.form.controls.subdomain.setValue(normalized);
    }
    this.resetSubdomainCheck();
  }

  onSlugBlur(): void {
    if (this.form.controls.slug.valid && this.form.controls.slug.value !== this.slugCheckedValue) {
      void this.checkSlug();
    }
  }

  async checkSlug(): Promise<boolean> {
    const slug = this.form.controls.slug.value;
    if (!slug || this.form.controls.slug.invalid) return false;

    this.slugStatus = 'checking';
    this.slugMessage = 'Checking availability…';

    try {
      const result = await firstValueFrom(
        this.api.post<SlugCheck>('/platform/tenants/check-slug', { slug }),
      );
      this.slugCheckedValue = slug;
      this.slugStatus = result.available ? 'available' : 'unavailable';
      this.slugMessage = result.available ? 'Available' : result.reason || 'This name is taken.';
      return result.available;
    } catch (error: unknown) {
      this.slugStatus = 'error';
      this.slugMessage =
        (error as HttpErrorResponse).error?.message || 'Could not check availability.';
      return false;
    }
  }

  private async ensureSlugAvailable(): Promise<boolean> {
    const slug = this.form.controls.slug.value;
    if (this.slugCheckedValue === slug && this.slugStatus === 'available') return true;
    const ok = await this.checkSlug();
    if (!ok) this.step = 1;
    return ok;
  }

  private async ensureSubdomainAvailable(): Promise<boolean> {
    const subdomain = this.form.controls.subdomain.value;
    if (subdomain === this.form.controls.slug.value) {
      return this.ensureSlugAvailable();
    }
    if (this.subdomainCheckedValue === subdomain && this.subdomainStatus === 'available') {
      return true;
    }

    this.subdomainStatus = 'checking';
    this.subdomainMessage = 'Checking availability…';

    try {
      const result = await firstValueFrom(
        this.api.post<SlugCheck>('/platform/tenants/check-slug', { slug: subdomain }),
      );
      this.subdomainCheckedValue = subdomain;
      this.subdomainStatus = result.available ? 'available' : 'unavailable';
      this.subdomainMessage = result.available ? 'Available' : result.reason || 'This subdomain is taken.';
      return result.available;
    } catch (error: unknown) {
      this.subdomainStatus = 'error';
      this.subdomainMessage =
        (error as HttpErrorResponse).error?.message || 'Could not check availability.';
      return false;
    }
  }

  private resetSlugCheck(): void {
    this.slugStatus = 'idle';
    this.slugMessage = '';
    this.slugCheckedValue = '';
  }

  private resetSubdomainCheck(): void {
    this.subdomainStatus = 'idle';
    this.subdomainMessage = '';
    this.subdomainCheckedValue = '';
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  // ─── Design ────────────────────────────────────────────────────────────────
  get theme(): ThemeValues {
    const c = this.form.controls;
    return {
      primary: c.primary.value,
      primary_dark: c.primary_dark.value,
      tint: c.tint.value,
      soft: c.soft.value,
      background: c.background.value,
      text: c.text.value,
      header: c.header.value,
      footer: c.footer.value,
      button_shape: c.button_shape.value,
      button_style: c.button_style.value,
    };
  }

  get previewVars(): Record<string, string> {
    const t = this.theme;
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
      '--pv-btn': solid
        ? t.primary
        : `linear-gradient(135deg, ${t.primary}, ${t.primary_dark})`,
      '--pv-banner': `radial-gradient(circle at 72% 38%, ${this.shade(t.primary, 0.06)} 0%, ${this.shade(t.primary, -0.18)} 48%, ${this.shade(t.primary_dark, -0.25)} 100%)`,
    };
  }

  applyPreset(preset: { name: string; colors: Record<ColorKey, string> }): void {
    this.form.patchValue(preset.colors);
  }

  setLayout(layout: string): void {
    this.form.controls.layout_template.setValue(layout);
  }

  layoutName(key: string): string {
    return this.layouts.find((layout) => layout.key === key)?.name || key;
  }

  private shade(hex: string, amount: number): string {
    if (!HEX_PATTERN.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    const target = amount < 0 ? 0 : 255;
    const p = Math.abs(amount);
    const channel = (v: number): string =>
      Math.round(v + (target - v) * p).toString(16).padStart(2, '0');
    return `#${channel((n >> 16) & 255)}${channel((n >> 8) & 255)}${channel(n & 255)}`;
  }

  // ─── Modules ───────────────────────────────────────────────────────────────
  loadModules(): void {
    this.moduleLoading = true;
    this.moduleError = '';

    this.api.get<PlatformModule[]>('/platform/modules').subscribe({
      next: (modules) => {
        this.modules = modules.filter((mod) => mod.status !== 'hidden');
        this.groupedModules = this.groupBy(this.modules);
        this.selectedModules = new Set(
          this.modules.filter((mod) => mod.is_core || mod.default_on).map((mod) => mod.key),
        );
        this.moduleLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.moduleLoading = false;
        this.moduleError = error.error?.message || 'Could not load the module catalogue.';
      },
    });
  }

  isSelected(mod: PlatformModule): boolean {
    return mod.is_core || this.selectedModules.has(mod.key);
  }

  toggleModule(mod: PlatformModule): void {
    this.moduleNotice = '';
    this.moduleWarning = '';

    if (mod.is_core) {
      this.moduleWarning = `${mod.label} is always included.`;
      return;
    }

    if (!mod.is_built) {
      this.moduleWarning = `${mod.label} is planned and cannot be selected yet.`;
      return;
    }

    if (this.selectedModules.has(mod.key)) {
      const dependents = this.dependentsOf(mod.key);
      if (dependents.length) {
        this.moduleWarning = `${mod.label} is required by ${dependents.map((m) => m.label).join(', ')}.`;
        return;
      }
      this.selectedModules.delete(mod.key);
      this.moduleNotice = `${mod.label} removed. Its data is kept if you enable it again.`;
      return;
    }

    this.selectedModules.add(mod.key);
    const added: PlatformModule[] = [];
    this.addDependencies(mod, added);

    if (added.length) {
      this.moduleNotice = `${added.map((m) => m.label).join(', ')} ${added.length === 1 ? 'was' : 'were'} added because ${mod.label} needs ${added.length === 1 ? 'it' : 'them'}.`;
    } else {
      this.moduleNotice = `${mod.label} added.`;
    }
  }

  dependentsOf(key: string): PlatformModule[] {
    return this.modules.filter(
      (mod) => this.selectedModules.has(mod.key) && mod.depends_on.includes(key),
    );
  }

  private addDependencies(mod: PlatformModule, added: PlatformModule[]): void {
    for (const key of mod.depends_on) {
      const dep = this.modules.find((m) => m.key === key);
      if (!dep || this.selectedModules.has(dep.key)) continue;
      this.selectedModules.add(dep.key);
      added.push(dep);
      this.addDependencies(dep, added);
    }
  }

  get selectedModuleList(): PlatformModule[] {
    return this.modules.filter((mod) => this.selectedModules.has(mod.key));
  }

  get selectedModuleCount(): number {
    return this.selectedModules.size;
  }

  moduleLabel(key: string): string {
    return this.modules.find((mod) => mod.key === key)?.label || key;
  }

  private groupBy(modules: PlatformModule[]): ModuleGroup[] {
    const groups = new Map<string, PlatformModule[]>();
    for (const mod of modules) {
      const list = groups.get(mod.group) ?? [];
      list.push(mod);
      groups.set(mod.group, list);
    }
    return [...groups.entries()].map(([name, list]) => ({ name, modules: list }));
  }

  // ─── Owner ─────────────────────────────────────────────────────────────────
  onOwnerModeChange(): void {
    const password = this.form.controls.owner_password;
    if (this.form.controls.owner_mode.value === 'password') {
      password.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(255)]);
    } else {
      password.clearValidators();
      password.setValue('');
    }
    password.updateValueAndValidity();
  }

  // ─── Review and create ─────────────────────────────────────────────────────
  get storefrontUrl(): string {
    return `https://${this.form.controls.subdomain.value}.${this.rootDomain}`;
  }

  get customDomainUrl(): string {
    const domain = this.form.controls.custom_domain.value.trim();
    return domain ? `https://${domain}` : '';
  }

  get adminUrl(): string {
    return `${this.storefrontUrl}/admin`;
  }

  get invite(): CreatedInvite | null {
    return this.result?.invite ?? null;
  }

  get isSubmitting(): boolean {
    return this.submitting || this.retrying;
  }

  createTenant(): void {
    if (!this.isStepValid(6)) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitError = '';

    firstValueFrom(this.api.post<TenantCreateResult>('/platform/tenants', this.payload()))
      .then((result) => this.handleResult(result))
      .catch((error: HttpErrorResponse) => this.handleError(error));
  }

  retryProvisioning(): void {
    if (!this.result) return;
    this.retrying = true;
    this.submitError = '';

    firstValueFrom(
      this.api.post<TenantCreateResult>(`/platform/tenants/${this.result.tenant.id}/provision`),
    )
      .then((result) => this.handleResult(result))
      .catch((error: HttpErrorResponse) => this.handleError(error));
  }

  private payload(): CreateTenantPayload {
    const c = this.form.controls;
    const mode = c.owner_mode.value;

    return {
      profile: {
        name: c.name.value.trim(),
        slug: c.slug.value,
        legal_name: c.legal_name.value.trim() || null,
        gstin: c.gstin.value.trim().toUpperCase() || null,
        email: c.email.value.trim(),
        phone: c.phone.value.trim() || null,
        currency: c.currency.value,
        timezone: c.timezone.value,
        locale: c.locale.value,
        logo_url: c.logo_url.value.trim() || null,
        favicon_url: null,
      },
      design: {
        layout_template: c.layout_template.value,
        theme: this.theme,
      },
      modules: [...this.selectedModules],
      owner: {
        name: c.owner_name.value.trim(),
        email: c.owner_email.value.trim(),
        phone: c.owner_phone.value.trim() || null,
        mode,
        ...(mode === 'password' ? { password: c.owner_password.value } : {}),
      },
      starter_content: true,
      route: {
        subdomain: c.subdomain.value,
        custom_domain: c.custom_domain.value.trim() || null,
      },
    };
  }

  private handleResult(result: TenantCreateResult): void {
    this.result = result;
    this.submitting = false;
    this.retrying = false;

    if (result.run.status === 'succeeded') {
      this.submitError = '';
      this.maxReached = this.steps.length;
    } else {
      this.submitError = result.run.error || `Provisioning failed at "${result.run.current_step}".`;
    }
  }

  private handleError(error: HttpErrorResponse): void {
    this.submitting = false;
    this.retrying = false;

    const body = error.error as { message?: string; data?: TenantCreateResult } | null;
    if (body?.data?.tenant) {
      this.handleResult(body.data);
      this.submitError = body.message || this.submitError;
      return;
    }

    this.submitError = body?.message || 'Could not create the shop. Check the API and try again.';
  }

  resetWizard(): void {
    this.result = null;
    this.submitError = '';
    this.step = 1;
    this.maxReached = 1;
    this.slugTouched = false;
    this.autoSubdomain = true;
    this.slugStatus = 'idle';
    this.slugMessage = '';
    this.slugCheckedValue = '';
    this.subdomainStatus = 'idle';
    this.subdomainMessage = '';
    this.subdomainCheckedValue = '';
    this.moduleNotice = '';
    this.moduleWarning = '';
    this.form.reset({
      name: '', slug: '', legal_name: '', gstin: '', email: '', phone: '',
      currency: 'INR', timezone: 'Asia/Kolkata', locale: 'en-IN', logo_url: '',
      layout_template: 'classic', ...DEFAULT_THEME,
      owner_name: '', owner_email: '', owner_phone: '', owner_mode: 'invite', owner_password: '',
      subdomain: '', custom_domain: '',
    });
    this.onOwnerModeChange();
    this.selectedModules = new Set(
      this.modules.filter((mod) => mod.is_core || mod.default_on).map((mod) => mod.key),
    );
  }

  // ─── Result helpers ────────────────────────────────────────────────────────
  stepClass(status: ProvisioningStepStatus): string {
    return `is-${status}`;
  }

  stepIcon(status: ProvisioningStepStatus): string {
    switch (status) {
      case 'done':
        return '✓';
      case 'failed':
        return '!';
      case 'skipped':
        return '–';
      case 'running':
        return '…';
      default:
        return '○';
    }
  }

  stepStatusLabel(status: ProvisioningStepStatus): string {
    switch (status) {
      case 'done':
        return 'Done';
      case 'failed':
        return 'Failed';
      case 'skipped':
        return 'Skipped';
      case 'running':
        return 'Running';
      default:
        return 'Pending';
    }
  }

  modulesAddedText(): string {
    const added = this.result?.modules_added ?? [];
    return added.map((item) => this.moduleLabel(item.key)).join(', ');
  }

  copiedField = '';

  copy(value: string, field: string): void {
    if (!value) return;
    void navigator.clipboard.writeText(value).then(() => {
      this.copiedField = field;
    });
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
