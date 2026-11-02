import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { RecurringJE } from '../models/recurring-je.model';

@Injectable({ providedIn: 'root' })
export class RecurringJEService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, any>) {
    return this.api.get<{ total: number; page: number; limit: number; total_pages: number; data: RecurringJE[] }>('/recurring-jes', params).pipe(
      map((r) => r.data || { data: [], total_pages: 0, total: 0, page: 1, limit: 20 })
    );
  }

  getById(id: number): Observable<RecurringJE> {
    return this.api.get<RecurringJE>(`/recurring-jes/${id}`).pipe(map((r) => r.data));
  }

  create(data: any): Observable<RecurringJE> {
    return this.api.post<RecurringJE>('/recurring-jes', data).pipe(map((r) => r.data));
  }

  update(id: number, data: any): Observable<RecurringJE> {
    return this.api.put<RecurringJE>(`/recurring-jes/${id}`, data).pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/recurring-jes/${id}`).pipe(map(() => undefined));
  }

  generate(): Observable<{ generated: number }> {
    return this.api.post<{ generated: number }>('/recurring-jes/generate').pipe(map((r) => r.data));
  }

  getAccounts(params?: Record<string, any>): Observable<any[]> {
    return this.api.get<any>('/chart-of-accounts/accounts', params).pipe(map((r) => r.data?.data || r.data || []));
  }
}
