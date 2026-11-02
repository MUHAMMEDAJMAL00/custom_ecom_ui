import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private api: ApiService) {}

  getAll(): Observable<any> {
    return this.api.get<any>('/config').pipe(map((r) => r.data));
  }

  set(data: { config_key: string; config_value: string; data_type: string }): Observable<void> {
    return this.api.post<void>('/config', data).pipe(map(() => undefined));
  }
}
