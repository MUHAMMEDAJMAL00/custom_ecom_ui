import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  ApproveRequestPayload,
  ApproveRequestResult,
  CreateReturnPayload,
  ReturnListParams,
  ReturnRecord,
  SaleForReturn,
  ScannedProduct,
} from '../models/return.model';

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  constructor(private api: ApiService) {}

  getAll(params: ReturnListParams) {
    return this.api.getPaginated<ReturnRecord>('/returns', params as Record<string, any>);
  }

  getById(id: number): Observable<ReturnRecord> {
    return this.api.get<ReturnRecord>(`/returns/${id}`).pipe(map((r) => r.data));
  }

  create(payload: CreateReturnPayload): Observable<ReturnRecord> {
    return this.api.post<ReturnRecord>('/returns', payload).pipe(map((r) => r.data));
  }

  /** Customer's website request: restock + refund (Razorpay for "original"). */
  approve(id: number, payload: ApproveRequestPayload): Observable<ApproveRequestResult> {
    return this.api.post<ApproveRequestResult>(`/returns/${id}/approve`, payload).pipe(map((r) => r.data));
  }

  reject(id: number, reason: string): Observable<ReturnRecord> {
    return this.api.post<ReturnRecord>(`/returns/${id}/reject`, { reason }).pipe(map((r) => r.data));
  }

  getSaleByInvoice(invoiceNumber: string): Observable<SaleForReturn> {
    return this.api.get<SaleForReturn>(`/sales/invoice/${encodeURIComponent(invoiceNumber)}`).pipe(map((r) => r.data));
  }

  scanBarcode(barcode: string): Observable<ScannedProduct> {
    return this.api.get<ScannedProduct>(`/barcode/scan/${encodeURIComponent(barcode)}`).pipe(map((r) => r.data));
  }
}
