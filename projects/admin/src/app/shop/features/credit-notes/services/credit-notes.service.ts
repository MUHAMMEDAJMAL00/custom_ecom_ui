import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { CreateCreditNotePayload, CreditNote, CreditNoteListParams } from '../models/credit-note.model';

@Injectable({ providedIn: 'root' })
export class CreditNotesService {
  constructor(private api: ApiService) {}

  getAll(params: CreditNoteListParams) {
    return this.api.getPaginated<CreditNote>('/credit-notes', params as Record<string, any>);
  }

  getById(id: number): Observable<CreditNote> {
    return this.api.get<CreditNote>(`/credit-notes/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateCreditNotePayload): Observable<CreditNote> {
    return this.api.post<CreditNote>('/credit-notes', payload).pipe(map((r) => r.data));
  }

  updateStatus(id: number, payment_status: string): Observable<CreditNote> {
    return this.api.patch<CreditNote>(`/credit-notes/${id}/status`, { payment_status }).pipe(map((r) => r.data));
  }
}
