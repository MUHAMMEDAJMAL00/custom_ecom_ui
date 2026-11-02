import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface CatalogueModule {
  key: string;
  label: string;
  group: string;
  description: string | null;
  is_core: boolean;
  is_built: boolean;
  status: string;
  sort_order: number;
  tenants: number;
}

interface EditDraft {
  label: string;
  description: string;
  sort_order: number;
  status: string;
}

@Component({
  selector: 'app-module-catalogue',
  standalone: false,
  templateUrl: './module-catalogue.component.html',
  styleUrls: ['./module-catalogue.component.scss'],
})
export class ModuleCatalogueComponent implements OnInit {
  modules: CatalogueModule[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  editing: CatalogueModule | null = null;
  draft: EditDraft = { label: '', description: '', sort_order: 0, status: 'active' };

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  get canEdit(): boolean {
    return this.auth.hasPermission('modules', 'update');
  }

  get builtCount(): number {
    return this.modules.filter((module) => module.is_built).length;
  }

  get totalUsage(): number {
    return this.modules.reduce((sum, module) => sum + (module.tenants || 0), 0);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<CatalogueModule[]>('/platform/modules').subscribe({
      next: (modules) => {
        this.modules = modules;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load the module catalogue.';
      },
    });
  }

  openEdit(module: CatalogueModule): void {
    this.editing = module;
    this.draft = {
      label: module.label,
      description: module.description || '',
      sort_order: module.sort_order,
      status: module.status || 'active',
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  @HostListener('document:keydown.escape')
  cancelEdit(): void {
    this.editing = null;
  }

  save(): void {
    if (!this.editing) return;

    this.saving = true;
    this.errorMessage = '';

    this.api.patch<CatalogueModule>(`/platform/modules/${this.editing.key}`, this.draft).subscribe({
      next: (updated) => {
        this.modules = this.modules.map((module) =>
          module.key === updated.key ? { ...module, ...updated } : module,
        );
        this.saving = false;
        this.editing = null;
        this.successMessage = 'Module updated.';
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Could not update this module.';
      },
    });
  }

  toggleStatus(module: CatalogueModule): void {
    const status = module.status === 'hidden' ? 'active' : 'hidden';
    this.api.patch<CatalogueModule>(`/platform/modules/${module.key}`, { status }).subscribe({
      next: (updated) => {
        this.modules = this.modules.map((row) =>
          row.key === updated.key ? { ...row, ...updated } : row,
        );
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Could not change module status.';
      },
    });
  }
}
