import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class GstDashboardService {
  constructor(private api: ApiService) {}

  getSummary(params?: Record<string, any>): Observable<any> {
    return this.api.get<any>('/gst/summary', params).pipe(map((r) => r.data));
  }

  getGstr1(params?: Record<string, any>): Observable<any> {
    return this.api.get<any>('/gst/gstr1', params).pipe(map((r) => r.data));
  }
}
