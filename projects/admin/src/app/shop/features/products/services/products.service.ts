import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CategoryOption, Product, ProductListParams, TaxGroupOption, UnitOption, NamedOption, SellerOption } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  getAll(params: ProductListParams) {
    return this.api.getPaginated<Product>('/products', params as Record<string, any>);
  }

  getById(id: number): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/products', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/products/${id}`).pipe(map(() => undefined));
  }

  getCategories(): Observable<CategoryOption[]> {
    return this.api.get<CategoryOption[]>('/categories').pipe(map((res) => res.data));
  }

  getBrands(): Observable<NamedOption[]> {
    if (!this.auth.hasModule('brands')) return of([]);
    return this.api.getPaginated<NamedOption>('/brands', { is_active: 1, limit: 500 }).pipe(map((res) => res.data));
  }

  /** Approved marketplace sellers that can own products (none when Marketplace is off for the shop). */
  getApprovedSellers(): Observable<SellerOption[]> {
    if (!this.auth.hasModule('marketplace')) return of([]);
    return this.api.getPaginated<SellerOption>('/sellers', { status: 'approved', limit: 500 }).pipe(map((res) => res.data));
  }

  getUnits(): Observable<UnitOption[]> {
    return this.api.getPaginated<UnitOption>('/units', { is_active: 1, limit: 200 }).pipe(map((res) => res.data));
  }

  getTaxGroups(): Observable<TaxGroupOption[]> {
    return this.api.getPaginated<TaxGroupOption>('/taxes', { is_active: 1, limit: 200 }).pipe(map((res) => res.data));
  }

  // ── Variant CRUD ─────────────────────────────────────────────
  getVariants(productId: number): Observable<any[]> {
    return this.api.get<any[]>(`/products/${productId}/variants`).pipe(map((res) => res.data));
  }

  createVariant(productId: number, data: any): Observable<any> {
    return this.api.post<any>(`/products/${productId}/variants`, data).pipe(map((res) => res.data));
  }

  updateVariant(productId: number, variantId: number, data: any): Observable<any> {
    return this.api.put<any>(`/products/${productId}/variants/${variantId}`, data).pipe(map((res) => res.data));
  }

  deleteVariant(productId: number, variantId: number): Observable<void> {
    return this.api.delete<void>(`/products/${productId}/variants/${variantId}`).pipe(map(() => undefined));
  }

  /** Uploads one product photo; returns its stored URL. */
  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.upload<any>('/products/upload-image', formData).pipe(map((res) => res.data.url));
  }

  uploadVariantImage(productId: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.upload<any>(`/products/${productId}/variants/upload-image`, formData).pipe(map((res) => res.data.url));
  }
}
