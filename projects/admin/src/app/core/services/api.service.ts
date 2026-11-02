import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  get<T>(path: string, query?: object, headers?: Record<string, string>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, {
        params: this.toParams(query),
        headers: this.toHeaders(headers),
      })
      .pipe(map((response) => response.data));
  }

  post<T>(path: string, body: unknown = {}, headers?: Record<string, string>): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
        headers: this.toHeaders(headers),
      })
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .patch<ApiResponse<T>>(`${this.baseUrl}${path}`, body)
      .pipe(map((response) => response.data));
  }

  delete<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, { body })
      .pipe(map((response) => response.data));
  }

  private toParams(query?: object): HttpParams {
    let params = new HttpParams();
    if (!query) return params;
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }

  private toHeaders(headers?: Record<string, string>): HttpHeaders {
    let httpHeaders = new HttpHeaders();
    if (!headers) return httpHeaders;
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null && value !== '') {
        httpHeaders = httpHeaders.set(key, value);
      }
    }
    return httpHeaders;
  }
}
