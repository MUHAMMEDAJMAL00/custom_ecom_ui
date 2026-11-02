import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginatedResult } from '../models/paginated-result.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, params?: Record<string, any>, context?: HttpContext): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params: this.toParams(params), context });
  }

  /** For list endpoints that spread { success, total, page, limit, total_pages, data } at the top level. */
  getPaginated<T>(path: string, params?: Record<string, any>, context?: HttpContext): Observable<PaginatedResult<T>> {
    return this.http.get<PaginatedResult<T>>(`${this.base}${path}`, { params: this.toParams(params), context });
  }

  post<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.base}${path}`, body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.base}${path}`, body ?? {});
  }

  patch<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(`${this.base}${path}`, body ?? {});
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.base}${path}`);
  }

  upload<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.base}${path}`, formData);
  }

  private toParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }
}
