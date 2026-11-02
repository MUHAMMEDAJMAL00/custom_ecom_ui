import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Vendor, VendorListParams, VendorPayment, VendorPurchase } from '../models/vendor.model';

@Injectable({ providedIn: 'root' })
export class VendorsService {
  constructor(private api: ApiService) {}

  getAll(params: VendorListParams) {
    return this.api.getPaginated<Vendor>('/vendors', params as Record<string, any>);
  }

  getById(id: number): Observable<Vendor> {
    return this.api.get<Vendor>(`/vendors/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Vendor>): Observable<Vendor> {
    return this.api.post<Vendor>('/vendors', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Vendor>): Observable<Vendor> {
    return this.api.put<Vendor>(`/vendors/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/vendors/${id}`).pipe(map(() => undefined));
  }

  getPurchases(id: number): Observable<VendorPurchase[]> {
    return this.api.get<VendorPurchase[]>(`/vendors/${id}/purchases`).pipe(map((res) => res.data));
  }

  getPayments(id: number): Observable<VendorPayment[]> {
    return this.api.get<VendorPayment[]>(`/vendors/${id}/payments`).pipe(map((res) => res.data));
  }
}
