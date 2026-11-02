import { storefrontLink } from '../../../../core/utils/shop-url';
import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { environment } from '../../../../../../environments/environment';

interface AdminReview {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[];
  is_verified: number;
  status: 'published' | 'hidden';
  helpful_count: number;
  created_at: string;
  Product?: { id: number; name: string; image_url: string | null };
  Customer?: { id: number; name: string; email: string | null; phone: string | null };
}

/** Products → Reviews: see every customer review, hide or delete the ones that break the rules. */
@Component({
  selector: 'app-review-list',
  standalone: false,
  templateUrl: './review-list.component.html',
  styleUrl: './review-list.component.css',
})
export class ReviewListComponent implements OnInit {
  reviews: AdminReview[] = [];
  counts = { published: 0, hidden: 0 };
  loading = true;
  errorMessage = '';
  page = 1;
  totalPages = 1;
  total = 0;
  search = '';
  status = '';
  rating = '';
  busyId: number | null = null;
  lightbox: string | null = null;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  readonly stars = [1, 2, 3, 4, 5];

  constructor(private api: ApiService, private notify: NotificationService, private confirm: ConfirmService) {}

  ngOnInit(): void {
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.api.getPaginated<AdminReview>('/reviews', {
      page: this.page,
      limit: 20,
      search: this.search || undefined,
      status: this.status || undefined,
      rating: this.rating || undefined,
    }).subscribe({
      next: (res: any) => {
        this.reviews = res.data;
        this.totalPages = res.total_pages || 1;
        this.total = res.total;
        this.counts = res.counts || this.counts;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load reviews.';
        this.loading = false;
      },
    });
  }

  onSearch(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 300);
  }

  imageSrc(url: string | null | undefined): string {
    if (!url) return '';
    if (/^(https?:|data:)/.test(url)) return url;
    return environment.apiUrl.replace(/\/api\/v1\/?$/, '') + (url.startsWith('/') ? '' : '/') + url;
  }

  productUrl(r: AdminReview): string {
    return storefrontLink(environment.storefrontUrl, `catalog/product/${r.Product?.id}#reviews`, environment.production, environment.rootDomain);
  }

  toggleStatus(r: AdminReview): void {
    const status = r.status === 'published' ? 'hidden' : 'published';
    this.busyId = r.id;
    this.api.patch(`/reviews/${r.id}/status`, { status }).pipe(map(() => status)).subscribe({
      next: (s) => {
        this.busyId = null;
        this.notify.success(s === 'hidden' ? 'Review hidden from the website' : 'Review is live again');
        this.load();
      },
      error: (err) => {
        this.busyId = null;
        this.notify.error(err.error?.message || 'Update failed');
      },
    });
  }

  async remove(r: AdminReview): Promise<void> {
    const ok = await this.confirm.show({
      title: 'Delete review',
      message: `Delete ${r.Customer?.name || 'this customer'}'s review of "${r.Product?.name}"?`,
      note: 'The customer can write a new one. Hiding keeps it instead.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    this.api.delete(`/reviews/${r.id}`).subscribe({
      next: () => {
        this.notify.success('Review deleted');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  ratingClass(n: number): string {
    return n >= 4 ? 'good' : n === 3 ? 'ok' : 'bad';
  }

  formatDate(s: string): string {
    const d = new Date(s);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
