import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateSupplierPaymentPayload,
  DuePurchase,
  SupplierLedgerResponse,
  SupplierPaymentRecord,
} from '../models/supplier-payment.model';

@Injectable({ providedIn: 'root' })
export class SupplierPaymentsService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, any>): Observable<SupplierPaymentRecord[]> {
    return this.api.get<SupplierPaymentRecord[]>('/supplier-payments', params).pipe(map((r) => r.data));
  }

  getLedger(vendorId: number): Observable<SupplierLedgerResponse> {
    return this.api.get<SupplierLedgerResponse>(`/supplier-payments/vendor/${vendorId}/ledger`).pipe(map((r) => r.data));
  }

  getDuePurchases(vendorId: number): Observable<DuePurchase[]> {
    return this.api.get<DuePurchase[]>(`/supplier-payments/vendor/${vendorId}/purchases`).pipe(map((r) => r.data));
  }

  create(payload: CreateSupplierPaymentPayload): Observable<unknown> {
    return this.api.post('/supplier-payments', payload).pipe(map((r) => r.data));
  }
}
