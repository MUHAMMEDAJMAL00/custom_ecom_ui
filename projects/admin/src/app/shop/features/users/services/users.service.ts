import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AppUser, Role, StoreOption, UserListParams } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}

  getAll(params: UserListParams) {
    return this.api.getPaginated<AppUser>('/users', params as Record<string, any>);
  }

  getById(id: number): Observable<AppUser> {
    return this.api.get<AppUser>(`/users/${id}`).pipe(map((res) => res.data));
  }

  create(data: Partial<AppUser> & { password: string }): Observable<AppUser> {
    return this.api.post<AppUser>('/users', data).pipe(map((res) => res.data));
  }

  update(id: number, data: Partial<AppUser>): Observable<AppUser> {
    return this.api.put<AppUser>(`/users/${id}`, data).pipe(map((res) => res.data));
  }

  remove(id: number): Observable<void> {
    return this.api.delete<void>(`/users/${id}`).pipe(map(() => undefined));
  }

  resetPassword(id: number, newPassword: string): Observable<unknown> {
    return this.api.put(`/users/${id}/reset-password`, { new_password: newPassword });
  }

  getRoles(): Observable<Role[]> {
    return this.api.get<Role[]>('/roles').pipe(map((res) => res.data));
  }

  getStores(): Observable<StoreOption[]> {
    return this.api.getPaginated<StoreOption>('/stores', { limit: 500 }).pipe(map((res) => res.data.filter((s) => s.is_active)));
  }
}
