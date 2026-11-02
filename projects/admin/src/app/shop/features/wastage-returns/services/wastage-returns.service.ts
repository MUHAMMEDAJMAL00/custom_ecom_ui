import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ProductRef, VendorReturnEntry, WastageEntry } from '../models/wastage-return.model';

@Injectable({ providedIn: 'root' })
export class WastageReturnsService {
  constructor(private api: ApiService) {}

  getWastages(params?: Record<string, any>) {
    return this.api.getPaginated<WastageEntry>('/wastages', params);
  }

  getVendorReturns(params?: Record<string, any>) {
    return this.api.getPaginated<VendorReturnEntry>('/vendor-returns', params);
  }

  getProducts(params?: Record<string, any>): Observable<ProductRef[]> {
    return this.api.get<ProductRef[]>('/products', params || { limit: 999 }).pipe(map((r) => r.data));
  }

  getVendors(params?: Record<string, any>): Observable<any[]> {
    return this.api.get<any[]>('/vendors', params || { limit: 999 }).pipe(map((r) => r.data));
  }

  getVendorProducts(vendorId: number): Observable<ProductRef[]> {
    return this.api.get<ProductRef[]>(`/vendor-returns/products/${vendorId}`).pipe(map((r) => r.data));
  }

  getPurchases(params?: Record<string, any>): Observable<any[]> {
    return this.api.get<any[]>('/purchases', params || { limit: 50 }).pipe(map((r) => r.data));
  }

  getProductDetails(id: number): Observable<{ purchase_price: number }> {
    return this.api.get<{ purchase_price: number }>(`/products/${id}`).pipe(map((r) => r.data));
  }

  getInventory(productId: number): Observable<any> {
    return this.api.get<any>(`/inventory/${productId}`).pipe(map((r) => r.data));
  }

  recordWastage(data: any): Observable<void> {
    return this.api.post<void>('/wastages', data).pipe(map(() => undefined));
  }

  recordVendorReturn(data: any): Observable<void> {
    return this.api.post<void>('/vendor-returns', data).pipe(map(() => undefined));
  }

  scanBarcode(barcode: string): Observable<any> {
    return this.api.get<any>(`/barcode/scan/${encodeURIComponent(barcode)}`).pipe(map((r) => r.data));
  }
}
