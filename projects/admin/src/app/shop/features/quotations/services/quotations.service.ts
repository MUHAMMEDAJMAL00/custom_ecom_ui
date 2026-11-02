import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  ConvertQuotationPayload,
  CreateQuotationPayload,
  Quotation,
  QuotationListParams,
  QuotationVersionRecord,
  UpdateQuotationPayload,
} from '../models/quotation.model';

@Injectable({ providedIn: 'root' })
export class QuotationsService {
  constructor(private api: ApiService) {}

  getAll(params: QuotationListParams) {
    return this.api.getPaginated<Quotation>('/quotations', params as Record<string, any>);
  }

  getById(id: number): Observable<Quotation> {
    return this.api.get<Quotation>(`/quotations/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateQuotationPayload): Observable<Quotation> {
    return this.api.post<Quotation>('/quotations', payload).pipe(map((r) => r.data));
  }

  update(id: number, payload: UpdateQuotationPayload): Observable<Quotation> {
    return this.api.patch<Quotation>(`/quotations/${id}`, payload).pipe(map((r) => r.data));
  }

  updateStatus(id: number, status: string): Observable<Quotation> {
    return this.api.patch<Quotation>(`/quotations/${id}/status`, { status }).pipe(map((r) => r.data));
  }

  getVersions(id: number): Observable<QuotationVersionRecord[]> {
    return this.api.get<QuotationVersionRecord[]>(`/quotations/${id}/versions`).pipe(map((r) => r.data));
  }

  convert(id: number, payload: ConvertQuotationPayload): Observable<Quotation> {
    return this.api.post<Quotation>(`/quotations/${id}/convert`, payload).pipe(map((r) => r.data));
  }
}
