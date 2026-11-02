import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { NotificationService } from '../../core/services/notification.service';
import { SharedModule } from '../../shared/shared.module';

interface Subscriber {
  id: number;
  email: string;
  source: string | null;
  created_at: string;
}

/** Newsletter subscribers from the storefront footer (new screen; MySkin stored them without a list). */
@Component({
  selector: 'app-newsletter-list',
  standalone: false,
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div class="page-header-left">
          <div class="page-title-main">Newsletter</div>
          <div class="page-breadcrumb">
            <a [routerLink]="'/dashboard' | shopUrl">Dashboard</a>
            <span class="sep">›</span>
            <span class="current">Newsletter</span>
          </div>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-outline" (click)="exportCsv()" [disabled]="!rows.length">Export CSV</button>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="toolbar-left">
            <div class="search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input type="text" placeholder="Search email…" autocomplete="off" [value]="search" (input)="onSearch($any($event.target).value)" />
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="pos-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Source</th>
                <th>Subscribed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading">
                <td colspan="5" class="tbl-empty"><span class="pos-loader"><span></span><span></span><span></span></span></td>
              </tr>
              <tr *ngIf="!loading && !rows.length">
                <td colspan="5" class="tbl-empty">No subscribers yet</td>
              </tr>
              <tr *ngFor="let s of rows; let i = index" [hidden]="loading">
                <td>{{ (page - 1) * limit + i + 1 }}</td>
                <td><span class="cell-name">{{ s.email }}</span></td>
                <td>{{ (s.source || 'website').replace('_', ' ') }}</td>
                <td>{{ s.created_at | date: 'dd MMM yyyy, h:mm a' }}</td>
                <td><app-row-actions [showDelete]="canDelete" (delete)="remove(s)"></app-row-actions></td>
              </tr>
            </tbody>
          </table>
        </div>
        <app-pagination *ngIf="totalPages > 1" [currentPage]="page" [totalPages]="totalPages" (pageChange)="goTo($event)"></app-pagination>
      </div>
    </div>
  `,
})
export class NewsletterListComponent implements OnInit {
  rows: Subscriber[] = [];
  loading = true;
  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  private debounce?: ReturnType<typeof setTimeout>;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private notify: NotificationService,
    private confirm: ConfirmService,
  ) {}

  get canDelete(): boolean {
    return this.auth.hasPermission('customers', 'delete');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getPaginated<Subscriber>('/newsletter-subscribers', { page: this.page, limit: this.limit, search: this.search }).subscribe({
      next: (res) => {
        this.rows = res.data;
        this.totalPages = res.total_pages || 1;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onSearch(value: string): void {
    this.search = value;
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 350);
  }

  goTo(page: number): void {
    this.page = page;
    this.load();
  }

  async remove(s: Subscriber): Promise<void> {
    const ok = await this.confirm.show({ title: 'Remove subscriber?', message: s.email, confirmLabel: 'Remove' });
    if (!ok) return;
    this.api.delete(`/newsletter-subscribers/${s.id}`).subscribe({
      next: () => {
        this.notify.success('Subscriber removed');
        this.load();
      },
    });
  }

  /** Downloads the current page of subscribers as CSV. */
  exportCsv(): void {
    const lines = ['email,source,subscribed_at', ...this.rows.map((r) => `${r.email},${r.source || ''},${r.created_at}`)];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'newsletter-subscribers.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}

const routes: Routes = [{ path: '', component: NewsletterListComponent }];

@NgModule({
  declarations: [NewsletterListComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
})
export class NewsletterModule {}
