import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { SharedModule } from '../../shared/shared.module';

interface ShopModule {
  key: string;
  label: string;
  group: string;
  description: string | null;
  is_core: boolean;
  is_built: boolean;
  depends_on: string[];
  enabled: boolean;
}

/** Read-only list of the modules the platform enabled for this shop (task1.md §8.2 item 6). */
@Component({
  selector: 'app-shop-module-list',
  standalone: false,
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title-main">Modules</div>
          <div class="page-breadcrumb">
            <a [routerLink]="'/dashboard' | shopUrl">Dashboard</a>
            <span class="sep">›</span>
            <span class="current">Modules</span>
          </div>
        </div>
        <div class="page-header-actions">
          <span class="badge badge-active">{{ enabledCount }} enabled</span>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="toolbar-left">
            <span class="form-hint">Modules are switched on by the platform. Contact support to change them.</span>
          </div>
          <div class="toolbar-right">
            <select class="filter-select" [value]="filter" (change)="filter = $any($event.target).value">
              <option value="enabled">Enabled</option>
              <option value="all">All modules</option>
            </select>
          </div>
        </div>
        <div class="table-wrap">
          <table class="pos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Module</th>
                <th>Group</th>
                <th>Description</th>
                <th>Requires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="6" class="tbl-empty"><span class="pos-loader"><span></span><span></span><span></span></span></td>
              </tr>
              <tr *ngIf="!loading && errorMessage">
                <td colspan="6" class="tbl-empty" style="color: #ef4444">{{ errorMessage }}</td>
              </tr>
              <tr *ngFor="let m of visible; let i = index">
                <td>{{ i + 1 }}</td>
                <td>
                  <span class="cell-name">{{ m.label }}</span>
                  <span class="badge badge-info" *ngIf="m.is_core" style="margin-left: 6px">core</span>
                </td>
                <td>{{ m.group }}</td>
                <td>{{ m.description || '—' }}</td>
                <td>{{ requires(m) }}</td>
                <td>
                  <span class="badge" [ngClass]="m.enabled ? 'badge-active' : 'badge-inactive'">{{ m.enabled ? 'enabled' : 'off' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ShopModuleListComponent implements OnInit {
  modules: ShopModule[] = [];
  loading = true;
  errorMessage = '';
  filter: 'enabled' | 'all' = 'enabled';

  constructor(private api: ApiService) {}

  get visible(): ShopModule[] {
    return this.filter === 'all' ? this.modules : this.modules.filter((m) => m.enabled);
  }

  get enabledCount(): number {
    return this.modules.filter((m) => m.enabled).length;
  }

  ngOnInit(): void {
    this.api.get<ShopModule[]>('/modules').subscribe({
      next: (res) => {
        this.modules = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Could not load modules.';
      },
    });
  }

  requires(m: ShopModule): string {
    return m.depends_on.map((key) => this.modules.find((x) => x.key === key)?.label || key).join(', ') || '—';
  }
}

const routes: Routes = [{ path: '', component: ShopModuleListComponent }];

@NgModule({
  declarations: [ShopModuleListComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
})
export class ShopModulesModule {}
