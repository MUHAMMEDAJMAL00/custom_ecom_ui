import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AppNotification, GenerateAlertsResult } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<AppNotification[]> {
    return this.api.get<AppNotification[]>('/notifications').pipe(map((r) => r.data));
  }

  markRead(id: number): Observable<void> {
    return this.api.patch<void>(`/notifications/${id}/read`).pipe(map(() => undefined));
  }

  markAllRead(): Observable<void> {
    return this.api.patch<void>('/notifications/read-all').pipe(map(() => undefined));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/notifications/${id}`).pipe(map(() => undefined));
  }

  generate(): Observable<GenerateAlertsResult> {
    return this.api.post<GenerateAlertsResult>('/notifications/generate').pipe(map((r) => r.data));
  }
}
