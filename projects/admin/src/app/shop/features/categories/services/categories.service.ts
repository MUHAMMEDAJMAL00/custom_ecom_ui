import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Category, CategoryListParams } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  constructor(private api: ApiService) {}

  getAll(params: CategoryListParams) {
    return this.api.getPaginated<Category>('/categories', params as Record<string, any>);
  }

  /** No `page` param — backend returns the full flat list (used for the parent dropdown). */
  getAllFlat(): Observable<Category[]> {
    return this.api.get<Category[]>('/categories').pipe(map((res) => res.data));
  }

  getById(id: number): Observable<Category> {
    return this.api.get<Category>(`/categories/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Category>): Observable<Category> {
    return this.api.post<Category>('/categories', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Category>): Observable<Category> {
    return this.api.put<Category>(`/categories/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/categories/${id}`).pipe(map(() => undefined));
  }
}
