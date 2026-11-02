import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../../environments/environment';
import { Brand, BrandListParams } from '../models/brand.model';

@Injectable({ providedIn: 'root' })
export class BrandsService {
  constructor(private api: ApiService) {}

  getAll(params: BrandListParams) {
    return this.api.getPaginated<Brand>('/brands', params as Record<string, any>);
  }

  /** Active brands for dropdowns (product form). */
  getActive(): Observable<Brand[]> {
    return this.api.getPaginated<Brand>('/brands', { is_active: 1, limit: 500 }).pipe(map((res) => res.data));
  }

  getById(id: number): Observable<Brand> {
    return this.api.get<Brand>(`/brands/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Brand>): Observable<Brand> {
    return this.api.post<Brand>('/brands', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Brand>): Observable<Brand> {
    return this.api.put<Brand>(`/brands/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/brands/${id}`).pipe(map(() => undefined));
  }

  uploadLogo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.upload<{ url: string }>('/brands/upload-logo', formData).pipe(map((res) => res.data.url));
  }

  /** Uploaded logos are stored as API-relative paths (/uploads/...). */
  logoSrc(url: string | null | undefined): string {
    if (!url) return '';
    if (/^(https?:|data:)/.test(url)) return url;
    const host = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
