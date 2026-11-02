import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Unit, UnitListParams, UomValue } from '../models/unit.model';

@Injectable({ providedIn: 'root' })
export class UnitsService {
  constructor(private api: ApiService) {}

  getAll(params: UnitListParams) {
    return this.api.getPaginated<Unit>('/units', params as Record<string, any>);
  }

  getById(id: number): Observable<Unit> {
    return this.api.get<Unit>(`/units/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Unit>): Observable<Unit> {
    return this.api.post<Unit>('/units', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Unit>): Observable<Unit> {
    return this.api.put<Unit>(`/units/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/units/${id}`).pipe(map(() => undefined));
  }

  addValue(unitId: number, value: number): Observable<UomValue> {
    return this.api.post<UomValue>(`/units/${unitId}/values`, { value }).pipe(map((res) => res.data));
  }

  removeValue(unitId: number, valueId: number): Observable<void> {
    return this.api.delete<void>(`/units/${unitId}/values/${valueId}`).pipe(map(() => undefined));
  }
}
