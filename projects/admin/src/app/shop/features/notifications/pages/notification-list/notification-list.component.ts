import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppNotification } from '../../models/notification.model';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-list',
  standalone: false,
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css',
})
export class NotificationListComponent implements OnInit {
  notifications: AppNotification[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private service: NotificationsService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (rows) => {
        this.notifications = rows;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.message || 'Failed to load notifications';
        this.loading = false;
      },
    });
  }

  typeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      low_stock: 'badge-warning',
      sale: 'badge-completed',
      payment: 'badge-active',
      payment_due: 'badge-warning',
      system: 'badge-inactive',
      alert: 'badge-cancelled',
    };
    return map[type] || 'badge-inactive';
  }

  formatDate(d: string): string {
    if (!d) return '—';
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return '—';
    return (
      parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
      ' ' +
      parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    );
  }

  markRead(n: AppNotification): void {
    this.service.markRead(n.id).subscribe({
      next: () => this.load(),
      error: () => this.notify.error('Failed'),
    });
  }

  remove(n: AppNotification): void {
    this.service.remove(n.id).subscribe({
      next: () => this.load(),
      error: () => this.notify.error('Failed'),
    });
  }

  markAllRead(): void {
    this.service.markAllRead().subscribe({
      next: () => {
        this.notify.success('All notifications marked as read');
        this.load();
      },
      error: () => this.notify.error('Failed'),
    });
  }

  generateAlerts(): void {
    this.service.generate().subscribe({
      next: (res) => {
        this.notify.success(`Generated ${res.generated || 0} alert(s)`);
        this.load();
      },
      error: () => this.notify.error('Failed'),
    });
  }
}
