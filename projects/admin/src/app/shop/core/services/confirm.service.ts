import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmOptions {
  title?: string;
  message?: string;
  note?: string;
  confirmLabel?: string;
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private requestSubject = new Subject<ConfirmRequest>();
  readonly requests$ = this.requestSubject.asObservable();

  show(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.requestSubject.next({ ...options, resolve });
    });
  }
}
