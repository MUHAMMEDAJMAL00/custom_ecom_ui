import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface TenantSummary {
  id: number;
  name: string;
  slug: string;
  status: string;
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

@Component({
  selector: 'app-tenant-modules',
  standalone: false,
  templateUrl: './tenant-modules.component.html',
  styleUrls: ['./tenant-modules.component.scss'],
})
export class TenantModulesComponent implements OnInit {
  tenant: TenantSummary | null = null;
  modules: ModuleOption[] = [];
  selected = new Set<string>();

  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  private readonly tenantId: number;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
  ) {
    this.tenantId = Number(this.route.snapshot.paramMap.get('id'));
  }

  get groups(): ModuleGroup[] {
    const map = new Map<string, ModuleOption[]>();
    for (const module of this.modules) {
      const name = module.group || 'Other';
      const rows = map.get(name) || [];
      rows.push(module);
      map.set(name, rows);
    }
    return Array.from(map, ([name, modules]) => ({ name, modules }));
  }

  get selectedCount(): number {
    return this.selected.size;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    forkJoin({
      tenant: this.api.get<TenantSummary>(`/platform/tenants/${this.tenantId}`),
      modules: this.api.get<ModuleOption[]>(`/platform/tenants/${this.tenantId}/modules`),
    }).subscribe({
      next: ({ tenant, modules }) => {
        this.tenant = tenant;
        this.applyModules(modules);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load shop modules.';
      },
    });
  }

  isSelected(module: ModuleOption): boolean {
    return module.is_core || this.selected.has(module.key);
  }

  toggle(module: ModuleOption): void {
    if (module.is_core || !module.is_built) return;

    if (this.selected.has(module.key)) {
      this.selected.delete(module.key);
    } else {
      this.selected.add(module.key);
      for (const dependency of module.depends_on) this.selected.add(dependency);
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
    this.saving = true;

    this.api
      .put<ModulesSaveResult>(`/platform/tenants/${this.tenantId}/modules`, {
        modules: Array.from(this.selected),
      })
      .subscribe({
        next: (result) => {
          this.applyModules(result.modules);
          this.saving = false;
          this.successMessage = result.added.length
            ? `Modules saved. Added automatically: ${result.added.join(', ')}.`
            : 'Shop modules saved.';
        },
        error: (error: HttpErrorResponse) => {
          this.saving = false;
          this.errorMessage = error.error?.message || 'Could not save shop modules.';
        },
      });
  }

  private applyModules(modules: ModuleOption[]): void {
    this.modules = modules;
    this.selected = new Set(
      modules.filter((module) => !module.is_core && module.enabled).map((module) => module.key),
    );
  }
}
