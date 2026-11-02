import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { BatchRow } from '../models/batch.model';

@Injectable({ providedIn: 'root' })
export class BatchTrackingService {
  constructor(private api: ApiService) {}

  getBatches(params: Record<string, any>): Observable<BatchRow[]> {
    return this.api.getPaginated<BatchRow>('/inventory', { type: 'batches', ...params }).pipe(map((res) => res.data));
  }
}
