import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuditLogListParams, AuditLogListResult } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  constructor(private api: ApiService) {}

  getAll(params: AuditLogListParams): Observable<AuditLogListResult> {
    return this.api.get<AuditLogListResult>('/audit-log', params as Record<string, any>).pipe(map((r) => r.data));
  }

  getModules(): Observable<string[]> {
    return this.api.get<string[]>('/audit-log/modules').pipe(map((r) => r.data));
  }
}
