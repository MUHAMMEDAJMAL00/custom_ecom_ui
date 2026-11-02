import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../../environments/environment';
import { Banner, BannerListParams } from '../models/banner.model';

@Injectable({ providedIn: 'root' })
export class BannersService {
  constructor(private api: ApiService) {}

  getAll(params: BannerListParams) {
    return this.api.getPaginated<Banner>('/banners', params as Record<string, any>);
  }

  getById(id: number): Observable<Banner> {
    return this.api.get<Banner>(`/banners/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Banner>): Observable<Banner> {
    return this.api.post<Banner>('/banners', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Banner>): Observable<Banner> {
    return this.api.put<Banner>(`/banners/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/banners/${id}`).pipe(map(() => undefined));
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.upload<{ url: string }>('/banners/upload-image', formData).pipe(map((res) => res.data.url));
  }

  /** Uploaded images are stored as API-relative paths (/uploads/banners/...). */
  imageSrc(url: string | null | undefined): string {
    if (!url) return '';
    if (/^(https?:|data:)/.test(url)) return url;
    const host = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
