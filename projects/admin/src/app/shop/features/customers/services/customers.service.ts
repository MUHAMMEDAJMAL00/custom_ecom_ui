import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Customer, CustomerListParams, LoyaltyTransaction } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  constructor(private api: ApiService) {}

  getAll(params: CustomerListParams) {
    return this.api.getPaginated<Customer>('/customers', params as Record<string, any>);
  }

  getById(id: number): Observable<Customer> {
    return this.api.get<Customer>(`/customers/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Customer>): Observable<Customer> {
    return this.api.post<Customer>('/customers', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Customer>): Observable<Customer> {
    return this.api.put<Customer>(`/customers/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/customers/${id}`).pipe(map(() => undefined));
  }

  getLoyaltyHistory(id: number): Observable<LoyaltyTransaction[]> {
    return this.api.get<LoyaltyTransaction[]>(`/customers/${id}/loyalty`).pipe(map((res) => res.data));
  }

  adjustLoyalty(id: number, points: number, notes: string | null): Observable<Customer> {
    return this.api.patch<Customer>(`/customers/${id}/loyalty`, { points, notes }).pipe(map((res) => res.data));
  }
}
