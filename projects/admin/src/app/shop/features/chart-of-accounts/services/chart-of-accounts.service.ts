import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PaginatedResult } from '../../../core/models/paginated-result.model';
import { AccountCategory, LedgerAccount } from '../models/chart-of-accounts.model';

@Injectable({ providedIn: 'root' })
export class ChartOfAccountsService {
  constructor(private api: ApiService) {}

  // Note: unlike most list endpoints, chart-of-accounts wraps the paginated
  // result one level deeper — { success, data: { total, page, ..., data: [] } }
  // — so this unwraps via get<PaginatedResult<T>>() instead of getPaginated<T>().
  getCategories(params?: Record<string, any>): Observable<PaginatedResult<AccountCategory>> {
    return this.api.get<PaginatedResult<AccountCategory>>('/chart-of-accounts/categories', params).pipe(map((r) => r.data));
  }

  getCategoryById(id: number): Observable<AccountCategory> {
    return this.api.get<AccountCategory>(`/chart-of-accounts/categories/${id}`).pipe(map((r) => r.data));
  }

  createCategory(data: Partial<AccountCategory>): Observable<AccountCategory> {
    return this.api.post<AccountCategory>('/chart-of-accounts/categories', data).pipe(map((r) => r.data));
  }

  updateCategory(id: number, data: Partial<AccountCategory>): Observable<AccountCategory> {
    return this.api.put<AccountCategory>(`/chart-of-accounts/categories/${id}`, data).pipe(map((r) => r.data));
  }

  deleteCategory(id: number): Observable<void> {
    return this.api.delete<void>(`/chart-of-accounts/categories/${id}`).pipe(map(() => undefined));
  }

  getAccounts(params?: Record<string, any>): Observable<PaginatedResult<LedgerAccount>> {
    return this.api.get<PaginatedResult<LedgerAccount>>('/chart-of-accounts/accounts', params).pipe(map((r) => r.data));
  }

  getAccountById(id: number): Observable<LedgerAccount> {
    return this.api.get<LedgerAccount>(`/chart-of-accounts/accounts/${id}`).pipe(map((r) => r.data));
  }

  createAccount(data: Partial<LedgerAccount>): Observable<LedgerAccount> {
    return this.api.post<LedgerAccount>('/chart-of-accounts/accounts', data).pipe(map((r) => r.data));
  }

  updateAccount(id: number, data: Partial<LedgerAccount>): Observable<LedgerAccount> {
    return this.api.put<LedgerAccount>(`/chart-of-accounts/accounts/${id}`, data).pipe(map((r) => r.data));
  }

  deleteAccount(id: number): Observable<void> {
    return this.api.delete<void>(`/chart-of-accounts/accounts/${id}`).pipe(map(() => undefined));
  }
}
