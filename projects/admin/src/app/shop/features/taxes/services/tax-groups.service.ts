import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { TaxGroup, TaxGroupListParams } from '../models/tax-group.model';

@Injectable({ providedIn: 'root' })
export class TaxGroupsService {
  constructor(private api: ApiService) {}

  getAll(params: TaxGroupListParams) {
    return this.api.getPaginated<TaxGroup>('/taxes', params as Record<string, any>);
  }

  getById(id: number): Observable<TaxGroup> {
    return this.api.get<TaxGroup>(`/taxes/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<TaxGroup>): Observable<TaxGroup> {
    return this.api.post<TaxGroup>('/taxes', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<TaxGroup>): Observable<TaxGroup> {
    return this.api.put<TaxGroup>(`/taxes/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/taxes/${id}`).pipe(map(() => undefined));
  }
}
