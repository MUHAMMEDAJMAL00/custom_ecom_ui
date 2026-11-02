import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CreatePurchasePayload, Purchase, PurchasePaymentPayload, PurchaseProduct, PurchaseVendor } from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, any>) {
    return this.api.getPaginated<Purchase>('/purchases', params);
  }

  getById(id: number): Observable<Purchase> {
    return this.api.get<Purchase>(`/purchases/${id}`).pipe(map((r) => r.data));
  }

  create(data: CreatePurchasePayload): Observable<Purchase> {
    return this.api.post<Purchase>('/purchases', data).pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string): Observable<void> {
    return this.api.patch<void>(`/purchases/${id}/status`, { status }).pipe(map(() => undefined));
  }

  addPayment(id: number, data: PurchasePaymentPayload): Observable<void> {
    return this.api.post<void>(`/purchases/${id}/payments`, data).pipe(map(() => undefined));
  }

  getVendors(): Observable<PurchaseVendor[]> {
    return this.api.get<PurchaseVendor[]>('/vendors', { limit: 500 }).pipe(map((r) => r.data));
  }

  getProducts(): Observable<PurchaseProduct[]> {
    return this.api.get<PurchaseProduct[]>('/products', { limit: 999 }).pipe(map((r) => r.data));
  }
}
