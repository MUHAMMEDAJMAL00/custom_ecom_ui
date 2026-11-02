import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CashRegister, CashRegisterHistory } from '../models/cash-register.model';

@Injectable({ providedIn: 'root' })
export class CashRegisterService {
  constructor(private api: ApiService) {}

  getActive(): Observable<CashRegister | null> {
    return this.api.get<CashRegister>('/cash/active').pipe(map((r) => r.data));
  }

  getAll(): Observable<CashRegisterHistory[]> {
    return this.api.get<CashRegisterHistory[]>('/cash').pipe(map((r) => r.data));
  }

  getById(id: number): Observable<CashRegister> {
    return this.api.get<CashRegister>(`/cash/${id}`).pipe(map((r) => r.data));
  }

  getSuggestedOpening(): Observable<{ suggested: number; source?: any }> {
    return this.api.get<{ suggested: number; source?: any }>('/cash/suggested-opening').pipe(map((r) => r.data));
  }

  open(data: { opening_balance: number; notes?: string }): Observable<CashRegister> {
    return this.api.post<CashRegister>('/cash/open', data).pipe(map((r) => r.data));
  }

  close(id: number, data: { closing_balance: number; notes?: string }): Observable<CashRegister> {
    return this.api.post<CashRegister>(`/cash/${id}/close`, data).pipe(map((r) => r.data));
  }

  addMovement(id: number, data: { movement_type: string; amount: number; notes?: string }): Observable<void> {
    return this.api.post<void>(`/cash/${id}/movement`, data).pipe(map(() => undefined));
  }
}
