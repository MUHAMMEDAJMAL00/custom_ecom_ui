import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private storage: TokenStorageService,
    private router: Router,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const isPlatform = request.url.includes('/platform/');
    const isAuthCall =
      request.url.includes('/auth/login') ||
      request.url.includes('/auth/refresh') ||
      request.url.includes('/auth/accept-invite');

    const token = isPlatform ? this.storage.token : this.storage.tenantSession?.token;
    const tenantSlug = this.storage.tenantSlug || this.storage.tenantSession?.tenant.slug;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isPlatform && tenantSlug) headers['X-Tenant'] = tenantSlug;
    // Branch picked in the shop header (MySkin X-Store-ID); the API allows only assigned branches.
    const storeId = sessionStorage.getItem('tenant.active_store_id');
    if (!isPlatform && storeId && !request.headers.has('X-Store-ID')) headers['X-Store-ID'] = storeId;

    const authorized = request.clone({ setHeaders: headers });

    return next.handle(authorized).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !isAuthCall) {
          if (isPlatform) {
            this.storage.clear();
            void this.router.navigate(['/platform/login']);
          } else {
            this.storage.clearTenantSession();
            const slug = this.storage.tenantSlug;
            void this.router.navigate(slug ? ['/t', slug, 'login'] : ['/platform/login']);
          }
        }
        return throwError(() => error);
      }),
    );
  }
}
