import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SalaryEmployee, SalaryPayment } from '../models/salary.model';

@Injectable({ providedIn: 'root' })
export class SalaryService {
  constructor(private api: ApiService) {}

  getSalaryStatus(params?: Record<string, any>): Observable<SalaryEmployee[]> {
    return this.api.get<SalaryEmployee[]>('/employees/salary-status', params).pipe(map((r) => r.data));
  }

  getPaymentHistory(params?: Record<string, any>) {
    return this.api.getPaginated<SalaryPayment>('/employees/salary-payments', params);
  }

  getEmployees(params?: Record<string, any>): Observable<any[]> {
    return this.api.get<any[]>('/employees', params).pipe(map((r) => r.data));
  }

  paySalary(employeeId: number, data: any): Observable<void> {
    return this.api.post<void>(`/employees/${employeeId}/salary`, data).pipe(map(() => undefined));
  }

  getSalarySummary(employeeId: number, salaryMonth: string): Observable<any> {
    return this.api.get<any>(`/employees/${employeeId}/salary-summary`, { salary_month: salaryMonth }).pipe(map((r) => r.data));
  }
}
