import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  HomeSections,
  StoreBanner,
  StoreCategory,
  StoreProduct,
  ProductPage,
  ProductQuery,
  StoreBrand,
  StorefrontBootstrap,
  ReviewPage,
} from '../models/storefront.model';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class StorefrontApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  bootstrap(tenant: string): Observable<StorefrontBootstrap> {
    return this.get<StorefrontBootstrap>('/storefront/bootstrap', tenant);
  }

  categories(tenant: string): Observable<StoreCategory[]> {
    return this.get<StoreCategory[]>('/storefront/categories', tenant);
  }

  banners(tenant: string): Observable<StoreBanner[]> {
    return this.get<StoreBanner[]>('/storefront/banners', tenant);
  }

  homeSections(tenant: string): Observable<HomeSections> {
    return this.get<HomeSections>('/storefront/home-sections', tenant);
  }

  /** Newest active products (MySkin /storefront/products returns them at the top level). */
  products(tenant: string, limit = 12): Observable<StoreProduct[]> {
    let params = new HttpParams().set('limit', limit);
    if (tenant) params = params.set('tenant', tenant);
    return this.http
      .get<ApiResponse<StoreProduct[]>>(`${this.baseUrl}/storefront/products`, { params })
      .pipe(map((response) => response.data));
  }

  /** Public catalogue page: filter by category slug, brand slug or search text. */
  productPage(tenant: string, query: ProductQuery): Observable<ProductPage> {
    let params = new HttpParams();
    if (tenant) params = params.set('tenant', tenant);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return this.http
      .get<ApiResponse<StoreProduct[]> & ProductPage>(`${this.baseUrl}/storefront/products`, { params })
      .pipe(map(({ total, page, limit, total_pages, data }) => ({ total, page, limit, total_pages, data })));
  }

  product(tenant: string, ref: string): Observable<StoreProduct> {
    return this.get<StoreProduct>(`/storefront/products/${encodeURIComponent(ref)}`, tenant);
  }

  category(tenant: string, slug: string): Observable<StoreCategory> {
    return this.get<StoreCategory>(`/storefront/categories/${encodeURIComponent(slug)}`, tenant);
  }

  brands(tenant: string): Observable<StoreBrand[]> {
    return this.get<StoreBrand[]>('/storefront/brands', tenant);
  }

  brand(tenant: string, slug: string): Observable<StoreBrand> {
    return this.get<StoreBrand>(`/storefront/brands/${encodeURIComponent(slug)}`, tenant);
  }

  /** Legal/CMS page from the shop's settings. */
  page(tenant: string, slug: string): Observable<{ slug: string; title: string; body?: string; content?: string }> {
    return this.get<{ slug: string; title: string; body?: string; content?: string }>(
      `/storefront/pages/${encodeURIComponent(slug)}`,
      tenant,
    );
  }

  newsletter(tenant: string, email: string): Observable<{ message?: string }> {
    return this.http
      .post<ApiResponse<{ message?: string }>>(
        `${this.baseUrl}/storefront/newsletter`,
        { email },
        { params: tenant ? new HttpParams().set('tenant', tenant) : undefined },
      )
      .pipe(map((response) => response.data ?? { message: response.message }));
  }

  /** Published reviews for a product (public; a customer token adds `voted_helpful`). */
  reviews(tenant: string, ref: string, page = 1, rating = ''): Observable<ReviewPage> {
    let params = new HttpParams().set('page', String(page)).set('limit', '6');
    if (tenant) params = params.set('tenant', tenant);
    if (rating) params = params.set('rating', rating);
    return this.http
      .get<ReviewPage & { success: boolean }>(
        `${this.baseUrl}/storefront/products/${encodeURIComponent(ref)}/reviews`,
        { params },
      )
      .pipe(
        map(({ summary, total, page: current, total_pages, data }) => ({
          summary,
          total,
          page: current,
          total_pages,
          data,
        })),
      );
  }

  private get<T>(path: string, tenant: string): Observable<T> {
    let params = new HttpParams();
    if (tenant) params = params.set('tenant', tenant);
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params })
      .pipe(map((response) => response.data));
  }
}
