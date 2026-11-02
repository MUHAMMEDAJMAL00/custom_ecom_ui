import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { PayrollAdvance, PayrollRun } from '../models/payroll.model';

@Injectable({ providedIn: 'root' })
export class PayrollService {
  constructor(private api: ApiService) {}

  getSummary(params?: Record<string, any>): Observable<{ stats: any; employees: any[] }> {
    return this.api.get<{ stats: any; employees: any[] }>('/payroll/summary', params).pipe(map((r) => r.data));
  }

  getRuns(params?: Record<string, any>) {
    return this.api.getPaginated<PayrollRun>('/payroll/runs', params);
  }

  getRunById(id: number): Observable<PayrollRun> {
    return this.api.get<PayrollRun>(`/payroll/runs/${id}`).pipe(map((r) => r.data));
  }

  createRun(data: any): Observable<void> {
    return this.api.post<void>('/payroll/runs', data).pipe(map(() => undefined));
  }

  bulkRun(items: any[]): Observable<void> {
    return this.api.post<void>('/payroll/runs/bulk', { items }).pipe(map(() => undefined));
  }

  getAdvances(params?: Record<string, any>) {
    return this.api.getPaginated<PayrollAdvance>('/payroll/advances', params);
  }

  createAdvance(data: any): Observable<void> {
    return this.api.post<void>('/payroll/advances', data).pipe(map(() => undefined));
  }
}
