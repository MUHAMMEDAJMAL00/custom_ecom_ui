import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface TenantDetail {
  id: number;
  name: string;
  slug: string;
  status: string;
  legal_name: string | null;
  gstin: string | null;
  email: string;
  phone: string | null;
  currency: string;
  timezone: string;
  locale: string;
  layout_template: string;
  logo_url: string | null;
  favicon_url: string | null;
}

interface ModuleOption {
  key: string;
  label: string;
  group: string | null;
  description: string;
  is_core: boolean;
  is_built: boolean;
  depends_on: string[];
  enabled: boolean;
}

interface ModuleGroup {
  name: string;
  modules: ModuleOption[];
}

interface ModulesSaveResult {
  modules: ModuleOption[];
  added: string[];
}

const CURRENCIES = ['INR', 'USD', 'AED', 'GBP', 'EUR', 'SGD'];
const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
];
const LOCALES = ['en-IN', 'en-US', 'en-GB', 'en-AE', 'en-SG', 'de-DE'];

@Component({
  selector: 'app-tenant-edit',
  standalone: false,
  templateUrl: './tenant-edit.component.html',
  styleUrls: ['./tenant-edit.component.scss'],
})
export class TenantEditComponent implements OnInit {
  readonly currencies = CURRENCIES;
  readonly timezones = TIMEZONES;
  readonly locales = LOCALES;
  readonly layouts = [
    { value: 'classic', label: 'Classic' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'electro', label: 'Electro (electronics)' },
  ];

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    legal_name: [''],
    gstin: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    currency: ['INR'],
    timezone: ['Asia/Kolkata'],
    locale: ['en-IN'],
    layout_template: ['classic'],
    logo_url: [''],
    favicon_url: [''],
  });

  tenant: TenantDetail | null = null;
  modules: ModuleOption[] = [];
  selectedModules = new Set<string>();
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  private readonly tenantId: number;

  get moduleGroups(): ModuleGroup[] {
    const map = new Map<string, ModuleOption[]>();
    for (const module of this.modules) {
      const name = module.group || 'Other';
      const group = map.get(name) || [];
      group.push(module);
      map.set(name, group);
    }
    return Array.from(map, ([name, modules]) => ({ name, modules }));
  }

  get selectedModuleCount(): number {
    return this.selectedModules.size;
  }

  get canEditProfile(): boolean {
    return this.auth.hasPermission('tenants', 'update');
  }

  get canEditModules(): boolean {
    return this.auth.hasPermission('tenant_modules', 'update');
  }

  get canSuspend(): boolean {
    return this.auth.hasPermission('tenants', 'suspend');
  }

  /** Always-on modules, shown as one strip instead of a checklist. */
  get coreModules(): ModuleOption[] {
    return this.modules.filter((module) => module.is_core);
  }

  /** Optional modules by group, for the switches. */
  get optionalGroups(): ModuleGroup[] {
    return this.moduleGroups
      .map((group) => ({ ...group, modules: group.modules.filter((module) => !module.is_core) }))
      .filter((group) => group.modules.length > 0);
  }

  groupSelectedCount(group: ModuleGroup): number {
    return group.modules.filter((module) => this.selectedModules.has(module.key)).length;
  }

  /** Unsaved profile or module changes (enables the save bar). */
  get dirty(): boolean {
    return this.form.dirty || this.modulesChanged;
  }

  get storefrontUrl(): string {
    const slug = this.tenant?.slug || '';
    return environment.production
      ? `https://${slug}.${environment.rootDomain}`
      : `${environment.storefrontUrl}/?tenant=${encodeURIComponent(slug)}`;
  }

  showSuspend = false;
  suspendReason = '';
  statusBusy = false;
  statusError = '';

  private modulesChanged = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {
    this.tenantId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      tenant: this.api.get<TenantDetail>(`/platform/tenants/${this.tenantId}`),
      modules: this.api.get<ModuleOption[]>(`/platform/tenants/${this.tenantId}/modules`),
    }).subscribe({
      next: ({ tenant, modules }) => {
        this.tenant = tenant;
        this.modules = modules;
        this.selectedModules = new Set(
          modules.filter((module) => !module.is_core && module.enabled).map((module) => module.key),
        );
        this.form.patchValue({
          name: tenant.name,
          legal_name: tenant.legal_name || '',
          gstin: tenant.gstin || '',
          email: tenant.email,
          phone: tenant.phone || '',
          currency: tenant.currency,
          timezone: tenant.timezone,
          locale: tenant.locale,
          layout_template: tenant.layout_template,
          logo_url: tenant.logo_url || '',
          favicon_url: tenant.favicon_url || '',
        });
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load this shop.';
      },
    });
  }

  isModuleSelected(module: ModuleOption): boolean {
    return module.is_core || this.selectedModules.has(module.key);
  }

  toggleModule(module: ModuleOption): void {
    if (!this.canEditModules || module.is_core || !module.is_built) return;

    this.modulesChanged = true;
    if (this.selectedModules.has(module.key)) {
      // Switching a module off also switches off the modules that need it
      // (the server re-adds dependencies, so leaving them on would undo this)
      const off = [module.key];
      while (off.length) {
        const key = off.pop()!;
        this.selectedModules.delete(key);
        for (const row of this.modules) {
          if (this.selectedModules.has(row.key) && row.depends_on.includes(key)) off.push(row.key);
        }
      }
    } else {
      this.selectedModules.add(module.key);
      for (const dependency of module.depends_on) this.selectedModules.add(dependency);
    }
  }

  requiresLabel(module: ModuleOption): string {
    return module.depends_on
      .map((key) => this.modules.find((row) => row.key === key)?.label || key)
      .join(', ');
  }

  save(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    forkJoin({
      tenant: this.api.patch<TenantDetail>(`/platform/tenants/${this.tenantId}`, this.form.getRawValue()),
      modules: this.api.put<ModulesSaveResult>(`/platform/tenants/${this.tenantId}/modules`, {
        modules: Array.from(this.selectedModules),
      }),
    }).subscribe({
      next: ({ tenant, modules }) => {
        this.tenant = tenant;
        this.modules = modules.modules;
        this.selectedModules = new Set(
          modules.modules.filter((module) => !module.is_core && module.enabled).map((module) => module.key),
        );
        this.saving = false;
        this.modulesChanged = false;
        this.form.markAsPristine();
        this.successMessage = 'Shop profile and module access saved.';
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Could not save this shop.';
      },
    });
  }

  back(): void {
    void this.router.navigate(['/platform/tenants']);
  }

  startSuspend(): void {
    this.showSuspend = true;
    this.suspendReason = '';
    this.statusError = '';
  }

  cancelSuspend(): void {
    if (this.statusBusy) return;
    this.showSuspend = false;
  }

  confirmSuspend(): void {
    const reason = this.suspendReason.trim();
    if (reason.length < 10) {
      this.statusError = 'Enter a reason of at least 10 characters.';
      return;
    }

    this.statusBusy = true;
    this.statusError = '';

    this.api.post<TenantDetail>(`/platform/tenants/${this.tenantId}/suspend`, { reason }).subscribe({
      next: (tenant) => {
        this.tenant = tenant;
        this.statusBusy = false;
        this.showSuspend = false;
        this.successMessage = 'Shop suspended. Storefront and shop admin are unavailable.';
      },
      error: (error: HttpErrorResponse) => {
        this.statusBusy = false;
        this.statusError = error.error?.message || 'Could not suspend this shop.';
      },
    });
  }

  activate(): void {
    this.statusBusy = true;
    this.statusError = '';

    this.api.post<TenantDetail>(`/platform/tenants/${this.tenantId}/activate`).subscribe({
      next: (tenant) => {
        this.tenant = tenant;
        this.statusBusy = false;
        this.successMessage = 'Shop activated. Storefront and shop admin are available again.';
      },
      error: (error: HttpErrorResponse) => {
        this.statusBusy = false;
        this.errorMessage = error.error?.message || 'Could not activate this shop.';
      },
    });
  }
}
