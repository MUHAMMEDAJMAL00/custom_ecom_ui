import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CreatePurchaseReturnPayload, PurchaseRef, PurchaseReturn, PurchaseReturnProduct, PurchaseReturnVendor } from '../models/purchase-return.model';

@Injectable({ providedIn: 'root' })
export class PurchaseReturnsService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, any>) {
    return this.api.getPaginated<PurchaseReturn>('/purchase-returns', params);
  }

  getById(id: number): Observable<PurchaseReturn> {
    return this.api.get<PurchaseReturn>(`/purchase-returns/${id}`).pipe(map((r) => r.data));
  }

  create(data: CreatePurchaseReturnPayload): Observable<PurchaseReturn> {
    return this.api.post<PurchaseReturn>('/purchase-returns', data).pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string): Observable<void> {
    return this.api.patch<void>(`/purchase-returns/${id}/status`, { status }).pipe(map(() => undefined));
  }

  getVendors(): Observable<PurchaseReturnVendor[]> {
    return this.api.get<PurchaseReturnVendor[]>('/vendors', { limit: 500 }).pipe(map((r) => r.data));
  }

  getProducts(params?: Record<string, any>): Observable<PurchaseReturnProduct[]> {
    return this.api.get<PurchaseReturnProduct[]>('/products', params || { limit: 999 }).pipe(map((r) => r.data));
  }

  getPurchasesWithRemaining(vendorId: number): Observable<PurchaseRef[]> {
    return this.api.get<PurchaseRef[]>(`/purchase-returns/vendor/${vendorId}/purchases`).pipe(map((r) => r.data));
  }

  getPurchaseItems(purchaseId: number): Observable<any[]> {
    return this.api.get<any[]>(`/purchase-returns/purchase/${purchaseId}/items`).pipe(map((r) => r.data));
  }

  getInventory(productId: number): Observable<any> {
    return this.api.get<any>(`/inventory/${productId}`).pipe(map((r) => r.data));
  }

  scanBarcode(barcode: string): Observable<PurchaseReturnProduct> {
    return this.api.get<PurchaseReturnProduct>(`/barcode/scan/${encodeURIComponent(barcode)}`).pipe(map((r) => r.data));
  }
}
