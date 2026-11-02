import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private api: ApiService) {}

  get(path: string, params?: Record<string, any>): Observable<any> {
    return this.api.get<any>(`/reports/${path}`, params);
  }
}
