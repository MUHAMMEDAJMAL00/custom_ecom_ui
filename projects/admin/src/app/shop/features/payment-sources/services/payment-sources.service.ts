import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { PaymentSource } from '../models/payment-source.model';

@Injectable({ providedIn: 'root' })
export class PaymentSourcesService {
  constructor(private api: ApiService) {}

  getAll(): Observable<PaymentSource[]> {
    return this.api.get<PaymentSource[]>('/payment-sources', { include_inactive: 'true' }).pipe(map((res) => res.data));
  }

  create(data: Partial<PaymentSource>): Observable<PaymentSource> {
    return this.api.post<PaymentSource>('/payment-sources', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<PaymentSource>): Observable<PaymentSource> {
    return this.api.put<PaymentSource>(`/payment-sources/${id}`, data).pipe(map((res) => res.data));
  }

  toggle(id: number): Observable<PaymentSource> {
    return this.api.patch<PaymentSource>(`/payment-sources/${id}/toggle`).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/payment-sources/${id}`).pipe(map(() => undefined));
  }
}
