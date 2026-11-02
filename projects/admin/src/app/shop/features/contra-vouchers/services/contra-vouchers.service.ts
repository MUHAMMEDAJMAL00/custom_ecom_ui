import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { ContraVoucher, ContraVoucherListParams, CreateContraVoucherPayload } from '../models/contra-voucher.model';

@Injectable({ providedIn: 'root' })
export class ContraVouchersService {
  constructor(private api: ApiService) {}

  getAll(params: ContraVoucherListParams) {
    return this.api.getPaginated<ContraVoucher>('/contra-vouchers', params as Record<string, any>);
  }

  getById(id: number): Observable<ContraVoucher> {
    return this.api.get<ContraVoucher>(`/contra-vouchers/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateContraVoucherPayload): Observable<ContraVoucher> {
    return this.api.post<ContraVoucher>('/contra-vouchers', payload).pipe(map((r) => r.data));
  }
}
