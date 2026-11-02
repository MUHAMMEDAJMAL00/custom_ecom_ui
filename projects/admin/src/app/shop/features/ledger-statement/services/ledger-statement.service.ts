import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LedgerStatementData } from '../models/ledger-statement.model';

@Injectable({ providedIn: 'root' })
export class LedgerStatementService {
  constructor(private api: ApiService) {}

  getAccountStatement(accountId: number, params?: Record<string, any>): Observable<LedgerStatementData> {
    return this.api.get<LedgerStatementData>(`/journal-entries/account-statement/${accountId}`, params).pipe(map((r) => r.data));
  }

  getAccounts(params?: Record<string, any>): Observable<any[]> {
    return this.api.get<any>('/chart-of-accounts/accounts', params).pipe(map((r) => r.data?.data || r.data || []));
  }
}
