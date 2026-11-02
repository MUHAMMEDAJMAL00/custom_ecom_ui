import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Sale, SaleStats } from '../../sales/models/sale.model';

@Injectable({ providedIn: 'root' })
export class OnlineOrdersService {
  constructor(private api: ApiService) {}

  getAll(params: Record<string, any> = {}) {
    return this.api.getPaginated<Sale>('/sales', params as Record<string, any>);
  }

  getStats(params: Record<string, any> = {}): Observable<SaleStats> {
    return this.api.get<SaleStats>('/sales/stats', params).pipe(map((r) => r.data));
  }

  getById(id: number): Observable<Sale> {
    return this.api.get<Sale>(`/sales/${id}`).pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string, notes?: string): Observable<Sale> {
    return this.api.patch<Sale>(`/sales/${id}/status`, { status, notes: notes || '' }).pipe(map((r) => r.data));
  }
}
