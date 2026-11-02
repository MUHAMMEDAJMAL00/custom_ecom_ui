import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { OfferStrip, OfferStripListParams } from '../models/offer-strip.model';

@Injectable({ providedIn: 'root' })
export class OfferStripsService {
  constructor(private api: ApiService) {}

  getAll(params: OfferStripListParams) {
    return this.api.getPaginated<OfferStrip>('/offer-strips', params as Record<string, any>);
  }

  getById(id: number): Observable<OfferStrip> {
    return this.api.get<OfferStrip>(`/offer-strips/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<OfferStrip>): Observable<OfferStrip> {
    return this.api.post<OfferStrip>('/offer-strips', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<OfferStrip>): Observable<OfferStrip> {
    return this.api.put<OfferStrip>(`/offer-strips/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/offer-strips/${id}`).pipe(map(() => undefined));
  }
}
