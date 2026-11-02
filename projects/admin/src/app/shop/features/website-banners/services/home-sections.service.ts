import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { HomeSection, HomeSectionItem } from '../models/home-section.model';

@Injectable({ providedIn: 'root' })
export class HomeSectionsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<HomeSection[]> {
    return this.api.get<HomeSection[]>('/home-sections').pipe(map((res) => res.data || []));
  }

  updateSection(key: string, data: Partial<HomeSection>): Observable<HomeSection> {
    return this.api.put<HomeSection>(`/home-sections/${key}`, data).pipe(map((res) => res.data));
  }

  createItem(key: string, data: Partial<HomeSectionItem>): Observable<HomeSectionItem> {
    return this.api.post<HomeSectionItem>(`/home-sections/${key}/items`, data).pipe(map((res) => res.data));
  }

  updateItem(id: number, data: Partial<HomeSectionItem>): Observable<HomeSectionItem> {
    return this.api.put<HomeSectionItem>(`/home-sections/items/${id}`, data).pipe(map((res) => res.data));
  }

  removeItem(id: number): Observable<void> {
    return this.api.delete<void>(`/home-sections/items/${id}`).pipe(map(() => undefined));
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.api.upload<{ url: string }>('/home-sections/upload-image', formData).pipe(map((res) => res.data.url));
  }
}
