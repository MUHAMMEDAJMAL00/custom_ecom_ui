import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Paginated } from '../../../core/models/api-response.model';
import { Tenant, TenantListFilters } from '../../../core/models/tenant.model';
import { ApiService } from '../../../core/services/api.service';
import {
  initials,
  tenantStatusClass,
  tenantStatusLabel,
} from '../../../core/utils/display.util';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-tenant-list',
  standalone: false,
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.scss'],
})
export class TenantListComponent implements OnInit {
  rows: Tenant[] = [];
  total = 0;
  page = 1;
  limit = 20;
  totalPages = 0;

  search = '';
  status = '';

  loading = true;
  errorMessage = '';

  readonly statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'provisioning', label: 'Provisioning' },
    { value: 'provisioning_failed', label: 'Failed' },
  ];

  readonly statusLabel = tenantStatusLabel;
  readonly statusClass = tenantStatusClass;
  readonly initials = initials;
  readonly isProduction = environment.production;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    const filters: TenantListFilters = {
      search: this.search.trim() || undefined,
      status: this.status || undefined,
      page: this.page,
      limit: this.limit,
    };

    this.api.get<Paginated<Tenant>>('/platform/tenants', filters).subscribe({
      next: (result) => {
        this.rows = result.data;
        this.total = result.total;
        this.totalPages = result.total_pages;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load shops.';
      },
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.search = '';
    this.status = '';
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  hasFilters(): boolean {
    return !!this.search.trim() || !!this.status;
  }
}
