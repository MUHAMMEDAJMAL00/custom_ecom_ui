import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import {
  MarkPaidPayload,
  PayoutListParams,
  Seller,
  SellerListParams,
  SellerPayout,
  SellerPayoutPreview,
} from '../models/seller.model';

@Injectable({ providedIn: 'root' })
export class SellersService {
  constructor(private api: ApiService) {}

  getAll(params: SellerListParams) {
    return this.api.getPaginated<Seller>('/sellers', params as Record<string, any>);
  }

  /** Marketplace default commission % (sellers without their own rate). */
  getDefaultCommission(): Observable<number> {
    return this.api.get<{ default_rate: number }>('/sellers/settings/commission').pipe(map((res) => Number(res.data.default_rate)));
  }

  setDefaultCommission(rate: number): Observable<number> {
    return this.api.put<{ default_rate: number }>('/sellers/settings/commission', { default_rate: rate }).pipe(map((res) => Number(res.data.default_rate)));
  }

  getById(id: number): Observable<Seller> {
    return this.api.get<Seller>(`/sellers/${id}`).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Seller>): Observable<Seller> {
    return this.api.put<Seller>(`/sellers/${id}`, data).pipe(map((res) => res.data));
  }

  approve(id: number): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/${id}/approve`).pipe(map((res) => res.data));
  }

  reject(id: number, reason: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/${id}/reject`, { reason }).pipe(map((res) => res.data));
  }

  suspend(id: number, reason: string): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/${id}/suspend`, { reason }).pipe(map((res) => res.data));
  }

  reactivate(id: number): Observable<Seller> {
    return this.api.patch<Seller>(`/sellers/${id}/reactivate`).pipe(map((res) => res.data));
  }

  previewPayout(id: number, periodTo: string): Observable<SellerPayoutPreview> {
    return this.api.get<SellerPayoutPreview>(`/sellers/${id}/payout-preview`, { period_to: periodTo }).pipe(map((res) => res.data));
  }

  createPayout(id: number, data: { period_to: string; notes?: string | null }): Observable<SellerPayout> {
    return this.api.post<SellerPayout>(`/sellers/${id}/payouts`, data).pipe(map((res) => res.data));
  }

  getPayouts(params: PayoutListParams) {
    return this.api.getPaginated<SellerPayout>('/sellers/payouts', params as Record<string, any>);
  }

  getPayout(id: number): Observable<SellerPayout> {
    return this.api.get<SellerPayout>(`/sellers/payouts/${id}`).pipe(map((res) => res.data));
  }

  markPayoutPaid(id: number, data: MarkPaidPayload): Observable<SellerPayout> {
    return this.api.patch<SellerPayout>(`/sellers/payouts/${id}/mark-paid`, data).pipe(map((res) => res.data));
  }

  cancelPayout(id: number): Observable<SellerPayout> {
    return this.api.patch<SellerPayout>(`/sellers/payouts/${id}/cancel`).pipe(map((res) => res.data));
  }
}
