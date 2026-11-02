import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { Paginated } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';

interface AuditRow {
  id: number;
  created_at: string;
  platform_user_id: number | null;
  platform_user_name: string | null;
  tenant_id: number | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: unknown;
  new_values: unknown;
  ip_address: string | null;
}

@Component({
  selector: 'app-audit-log',
  standalone: false,
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss'],
})
export class AuditLogComponent implements OnInit {
  rows: AuditRow[] = [];
  total = 0;
  page = 1;
  limit = 25;
  totalPages = 0;

  action = '';
  from = '';
  to = '';

  loading = true;
  errorMessage = '';
  selected: AuditRow | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api
      .get<Paginated<AuditRow>>('/platform/audit-logs', {
        action: this.action.trim() || undefined,
        from: this.from || undefined,
        to: this.to || undefined,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (result) => {
          this.rows = result.data;
          this.total = result.total;
          this.totalPages = result.total_pages;
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Could not load the audit log.';
        },
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  clearFilters(): void {
    this.action = '';
    this.from = '';
    this.to = '';
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  openDetails(row: AuditRow): void {
    this.selected = row;
  }

  @HostListener('document:keydown.escape')
  closeDetails(): void {
    this.selected = null;
  }

  hasValues(row: AuditRow): boolean {
    return row.old_values !== null || row.new_values !== null;
  }
}
