import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Asset } from '../models/asset.model';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  constructor(private api: ApiService) {}

  getAll(params?: Record<string, any>) {
    return this.api.getPaginated<Asset>('/assets', params);
  }

  getById(id: number): Observable<Asset> {
    return this.api.get<Asset>(`/assets/${id}`).pipe(map((r) => r.data));
  }

  create(data: Partial<Asset>): Observable<Asset> {
    return this.api.post<Asset>('/assets', data).pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<Asset>): Observable<Asset> {
    return this.api.put<Asset>(`/assets/${id}`, data).pipe(map((r) => r.data));
  }

  postDepreciation(id: number, data: { amount: number; date: string }): Observable<void> {
    return this.api.post<void>(`/assets/${id}/depreciation`, data).pipe(map(() => undefined));
  }
}
