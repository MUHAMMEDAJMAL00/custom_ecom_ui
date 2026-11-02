import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Expense, ExpenseCategory, ExpenseSummary } from '../models/expense.model';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  constructor(private api: ApiService) {}

  getSummary(): Observable<ExpenseSummary> {
    return this.api.get<ExpenseSummary>('/expenses/summary').pipe(map((r) => r.data));
  }

  getAll(params?: Record<string, any>) {
    return this.api.getPaginated<Expense>('/expenses', params);
  }

  getById(id: number): Observable<Expense> {
    return this.api.get<Expense>(`/expenses/${id}`).pipe(map((r) => r.data));
  }

  create(data: Partial<Expense>): Observable<Expense> {
    return this.api.post<Expense>('/expenses', data).pipe(map((r) => r.data));
  }

  update(id: number, data: Partial<Expense>): Observable<Expense> {
    return this.api.patch<Expense>(`/expenses/${id}`, data).pipe(map((r) => r.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/expenses/${id}`).pipe(map(() => undefined));
  }

  getCategories(): Observable<ExpenseCategory[]> {
    return this.api.get<ExpenseCategory[]>('/expenses/categories').pipe(map((r) => r.data));
  }

  createCategory(data: Partial<ExpenseCategory>): Observable<ExpenseCategory> {
    return this.api.post<ExpenseCategory>('/expenses/categories', data).pipe(map((r) => r.data));
  }

  updateCategory(id: number, data: Partial<ExpenseCategory>): Observable<ExpenseCategory> {
    return this.api.patch<ExpenseCategory>(`/expenses/categories/${id}`, data).pipe(map((r) => r.data));
  }

  removeCategory(id: number): Observable<void> {
    return this.api.delete<void>(`/expenses/categories/${id}`).pipe(map(() => undefined));
  }
}
