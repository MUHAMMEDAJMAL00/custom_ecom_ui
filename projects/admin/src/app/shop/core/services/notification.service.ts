import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'danger' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  private toastSubject = new Subject<Toast>();
  readonly toasts$ = this.toastSubject.asObservable();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('danger', message);
  }

  warning(message: string): void {
    this.push('warning', message);
  }

  private push(type: ToastType, message: string): void {
    this.toastSubject.next({ id: ++this.counter, type, message });
  }
}
