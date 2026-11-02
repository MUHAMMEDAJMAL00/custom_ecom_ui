import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateCustomerPaymentPayload,
  CustomerLedgerResponse,
  CustomerPaymentRecord,
  DueCustomer,
  DueSale,
} from '../models/customer-payment.model';

@Injectable({ providedIn: 'root' })
export class CustomerPaymentsService {
  constructor(private api: ApiService) {}

  getDueCustomers(): Observable<DueCustomer[]> {
    return this.api.get<DueCustomer[]>('/customer-payments/due').pipe(map((r) => r.data));
  }

  getAll(params?: Record<string, any>): Observable<CustomerPaymentRecord[]> {
    return this.api.get<CustomerPaymentRecord[]>('/customer-payments', params).pipe(map((r) => r.data));
  }

  getLedger(customerId: number): Observable<CustomerLedgerResponse> {
    return this.api.get<CustomerLedgerResponse>(`/customer-payments/customer/${customerId}/ledger`).pipe(map((r) => r.data));
  }

  getDueSales(customerId: number): Observable<DueSale[]> {
    return this.api.get<DueSale[]>(`/customer-payments/customer/${customerId}/sales`).pipe(map((r) => r.data));
  }

  create(payload: CreateCustomerPaymentPayload): Observable<unknown> {
    return this.api.post('/customer-payments', payload).pipe(map((r) => r.data));
  }
}
