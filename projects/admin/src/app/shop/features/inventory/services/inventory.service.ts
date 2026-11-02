import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { InventoryRow, ProductInventoryDetail, ProductSearchResult, StockMovement, StoreRef } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private api: ApiService) {}

  getStock(params: Record<string, any>) {
    return this.api.getPaginated<InventoryRow>('/inventory', params);
  }

  getLowStock(params: Record<string, any>): Observable<InventoryRow[]> {
    return this.api.get<InventoryRow[]>('/inventory/low-stock', params).pipe(map((res) => res.data));
  }

  getMovements(params: Record<string, any>) {
    return this.api.getPaginated<StockMovement>('/inventory/movements', params);
  }

  getByProduct(productId: number, storeId?: number | null): Observable<ProductInventoryDetail> {
    return this.api
      .get<ProductInventoryDetail>(`/inventory/${productId}`, storeId ? { store_id: storeId } : undefined)
      .pipe(map((res) => res.data));
  }

  adjust(payload: {
    product_id: number;
    store_id: number;
    quantity_change: number;
    movement_type: string;
    notes?: string | null;
  }): Observable<unknown> {
    return this.api.post('/inventory/adjust', payload);
  }

  transfer(payload: {
    product_id: number;
    from_store_id: number;
    to_store_id: number;
    quantity: number;
    notes?: string | null;
  }): Observable<unknown> {
    return this.api.post('/inventory/transfer', payload);
  }

  searchProducts(search: string, limit = 8): Observable<ProductSearchResult[]> {
    return this.api.getPaginated<ProductSearchResult>('/products', { search, limit, is_active: 1 }).pipe(map((res) => res.data));
  }

  getAllActiveProducts(): Observable<ProductSearchResult[]> {
    return this.api.getPaginated<ProductSearchResult>('/products', { limit: 9999, is_active: 1 }).pipe(map((res) => res.data));
  }

  getActiveStores(): Observable<StoreRef[]> {
    return this.api.getPaginated<StoreRef>('/stores', { limit: 9999, is_active: 1 }).pipe(map((res) => res.data));
  }
}
