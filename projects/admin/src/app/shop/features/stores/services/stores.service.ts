import { Injectable } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SKIP_STORE_SCOPE } from '../../../core/http/skip-store-scope.token';
import { CreateStorePayload, Store, StoreListParams } from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoresService {
  constructor(private api: ApiService) {}

  // Bypasses the auto-attached X-Store-ID header — the backend returns a
  // single-store result when that header is present, but this management
  // page always needs the full cross-store list.
  getAll(params: StoreListParams) {
    const context = new HttpContext().set(SKIP_STORE_SCOPE, true);
    return this.api.getPaginated<Store>('/stores', params as Record<string, any>, context);
  }

  getById(id: number): Observable<Store> {
    return this.api.get<Store>(`/stores/${id}`).pipe(map((r) => r.data));
  }

  create(data: CreateStorePayload): Observable<Store> {
    return this.api.post<Store>('/stores', data).pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<CreateStorePayload>): Observable<Store> {
    return this.api.put<Store>(`/stores/${id}`, data).pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/stores/${id}`).pipe(map(() => undefined));
  }
}
