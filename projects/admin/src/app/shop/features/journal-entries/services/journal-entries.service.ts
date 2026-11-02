import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { JournalEntry } from '../models/journal-entry.model';

@Injectable({ providedIn: 'root' })
export class JournalEntriesService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, any>) {
    return this.api.getPaginated<JournalEntry>('/journal-entries', params);
  }

  getById(id: number): Observable<JournalEntry> {
    return this.api.get<JournalEntry>(`/journal-entries/${id}`).pipe(map((r) => r.data));
  }

  create(data: any): Observable<JournalEntry> {
    return this.api.post<JournalEntry>('/journal-entries', data).pipe(map((r) => r.data));
  }

  getAccountStatement(accountId: number, params?: Record<string, any>): Observable<any> {
    return this.api.get<any>(`/journal-entries/account-statement/${accountId}`, params).pipe(map((r) => r.data));
  }

  getAccounts(params?: Record<string, any>) {
    return this.api.getPaginated<any>('/chart-of-accounts/accounts', params);
  }
}
