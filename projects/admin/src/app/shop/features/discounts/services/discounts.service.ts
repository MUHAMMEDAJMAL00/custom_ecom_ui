import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Discount, DiscountListParams } from '../models/discount.model';

@Injectable({ providedIn: 'root' })
export class DiscountsService {
  constructor(private api: ApiService) {}

  getAll(params: DiscountListParams) {
    return this.api.getPaginated<Discount>('/discounts', params as Record<string, any>);
  }

  getById(id: number): Observable<Discount> {
    return this.api.get<Discount>(`/discounts/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Discount>): Observable<Discount> {
    return this.api.post<Discount>('/discounts', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Discount>): Observable<Discount> {
    return this.api.patch<Discount>(`/discounts/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/discounts/${id}`).pipe(map(() => undefined));
  }

  resetUsage(id: number): Observable<unknown> {
    return this.api.patch(`/discounts/${id}/reset-usage`);
  }
}
