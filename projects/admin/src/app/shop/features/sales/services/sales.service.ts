import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AddSalePaymentPayload, Sale, SaleListParams, SaleStats } from '../models/sale.model';

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private api: ApiService) {}

  getAll(params: SaleListParams) {
    return this.api.getPaginated<Sale>('/sales', params as Record<string, any>);
  }

  getStats(params: Record<string, any>): Observable<SaleStats> {
    return this.api.get<SaleStats>('/sales/stats', params).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<Sale> {
    return this.api.get<Sale>(`/sales/${id}`).pipe(map((r) => r.data));
  }

  cancel(id: number, notes: string): Observable<Sale> {
    return this.api.patch<Sale>(`/sales/${id}/status`, { status: 'cancelled', notes }).pipe(map((r) => r.data));
  }

  addPayment(id: number, payload: AddSalePaymentPayload): Observable<Sale> {
    return this.api.post<Sale>(`/sales/${id}/payments`, payload).pipe(map((r) => r.data));
  }
}
