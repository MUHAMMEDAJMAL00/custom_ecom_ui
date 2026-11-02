import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService, Toast } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub?: Subscription;

  constructor(private notify: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notify.toasts$.subscribe((toast) => {
      this.toasts.push(toast);
      setTimeout(() => this.dismiss(toast.id), 3200);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
