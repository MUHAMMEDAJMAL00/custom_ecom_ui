import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private notify: NotificationService,
    private injector: Injector,
  ) {}

  /** A module was switched off on the platform: refresh the session so the sidebar hides it. */
  private refreshModules(): void {
    // Resolved lazily: TenantAuthService depends on HttpClient, which depends on this interceptor
    import('../../../core/services/tenant-auth.service').then(({ TenantAuthService }) => {
      const auth = this.injector.get(TenantAuthService);
      const slug = auth.tenant?.slug;
      if (slug) auth.me(slug).subscribe({ error: () => undefined });
    });
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Toasts are for the shop admin (MySkin screens); platform and auth screens show their own errors.
    if (req.url.includes('/platform/') || req.url.includes('/auth/')) return next.handle(req);
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        // A lookup into a module the shop doesn't have (e.g. sellers without Marketplace)
        // is expected: the screen simply shows no options, so no error toast.
        if (err.status === 403 && err.error?.code === 'module_disabled' && !req.url.includes('/auth/me')) {
          this.refreshModules();
        }
        if (err.status === 401 || (err.status === 403 && err.error?.code === 'module_disabled' && req.method === 'GET')) {
          return throwError(() => err);
        }
        const message = err.error?.message || err.error?.errors?.join(', ') || 'Something went wrong. Please try again.';
        if (err.status >= 500) {
          this.notify.error('Server error — ' + message);
        } else if (err.status >= 400) {
          this.notify.error(message);
        }
        return throwError(() => err);
      }),
    );
  }
}
