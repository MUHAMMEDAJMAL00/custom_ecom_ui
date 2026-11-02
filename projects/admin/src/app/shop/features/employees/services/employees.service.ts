import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Employee, EmployeeListParams, PaySalaryPayload } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  constructor(private api: ApiService, private auth: AuthService) {}

  getAll(params: EmployeeListParams): Observable<Employee[]> {
    const storeId = this.auth.activeStoreId;
    return this.api
      .get<Employee[]>('/employees', { ...params, store_id: storeId ?? undefined })
      .pipe(map((res) => res.data));
  }

  getById(id: number): Observable<Employee> {
    return this.api.get<Employee>(`/employees/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<Employee>): Observable<Employee> {
    return this.api.post<Employee>('/employees', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<Employee>): Observable<Employee> {
    return this.api.put<Employee>(`/employees/${id}`, data).pipe(map((res) => res.data));
  }

  paySalary(id: number, payload: PaySalaryPayload): Observable<unknown> {
    return this.api.post(`/employees/${id}/salary`, payload);
  }
}
