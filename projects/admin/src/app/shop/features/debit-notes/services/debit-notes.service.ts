import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { CreateDebitNotePayload, DebitNote, DebitNoteListParams } from '../models/debit-note.model';

@Injectable({ providedIn: 'root' })
export class DebitNotesService {
  constructor(private api: ApiService) {}

  getAll(params: DebitNoteListParams) {
    return this.api.getPaginated<DebitNote>('/debit-notes', params as Record<string, any>);
  }

  getById(id: number): Observable<DebitNote> {
    return this.api.get<DebitNote>(`/debit-notes/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateDebitNotePayload): Observable<DebitNote> {
    return this.api.post<DebitNote>('/debit-notes', payload).pipe(map((r) => r.data));
  }

  updateStatus(id: number, payment_status: string): Observable<DebitNote> {
    return this.api.patch<DebitNote>(`/debit-notes/${id}/status`, { payment_status }).pipe(map((r) => r.data));
  }
}
