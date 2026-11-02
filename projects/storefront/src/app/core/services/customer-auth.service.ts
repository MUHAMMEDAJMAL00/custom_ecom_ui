import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CustomerSession, CustomerUser } from '../models/customer.model';
import { ShopContextService } from './shop-context.service';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * Customer sign-in state for one shop. Tokens are stored per tenant slug, so two shops
 * open in the same browser never share a session. Protected calls add the bearer token
 * and refresh it once on a 401.
 */
@Injectable({ providedIn: 'root' })
export class CustomerAuthService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly session$ = new BehaviorSubject<CustomerSession | null>(null);
  private refreshInFlight?: Observable<void>;

  /** The signed-in customer, or null. */
  readonly user$ = this.session$.pipe(
    map((session) => session?.customer ?? null),
    distinctUntilChanged((a, b) => (a?.id ?? 0) === (b?.id ?? 0)),
  );

  constructor(
    private http: HttpClient,
    private shop: ShopContextService,
  ) {
    this.session$.next(this.read());
  }

  get user(): CustomerUser | null {
    return this.session$.value?.customer ?? null;
  }

  get isLoggedIn(): boolean {
    return !!this.session$.value?.token;
  }

  login(email: string, password: string): Observable<CustomerUser> {
    return this.publicPost<CustomerSession>('/storefront/customer-auth/login', { email, password }).pipe(
      tap((session) => this.save(session)),
      map((session) => session.customer),
    );
  }

  signup(body: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirm_password: string;
  }): Observable<CustomerUser> {
    return this.publicPost<CustomerSession>('/storefront/customer-auth/signup', body).pipe(
      tap((session) => this.save(session)),
      map((session) => session.customer),
    );
  }

  logout(): void {
    const refresh = this.session$.value?.refresh_token;
    if (refresh) {
      this.request<unknown>('POST', '/storefront/customer-auth/logout', { refresh_token: refresh }).subscribe({
        next: () => undefined,
        error: () => undefined,
      });
    }
    this.clear();
  }

  updateProfile(data: Partial<CustomerUser>): Observable<CustomerUser> {
    return this.request<CustomerUser>('PATCH', '/storefront/customer-auth/me', data).pipe(
      tap((customer) => this.patchCustomer(customer)),
    );
  }

  changePassword(current_password: string, new_password: string, confirm_password: string): Observable<void> {
    return this.request<CustomerSession>('POST', '/storefront/customer-auth/change-password', {
      current_password,
      new_password,
      confirm_password,
    }).pipe(
      tap((session) => {
        if (session?.token) this.save({ ...session, customer: session.customer || this.user! });
        else this.reloadMe();
      }),
      map(() => undefined),
    );
  }

  forgotPassword(identifier: string): Observable<{ channel: string }> {
    return this.publicPost<{ channel: string }>('/storefront/customer-auth/forgot-password', { identifier });
  }

  verifyResetCode(identifier: string, code: string): Observable<{ reset_token: string }> {
    return this.publicPost<{ reset_token: string }>('/storefront/customer-auth/verify-reset-code', { identifier, code });
  }

  resetPassword(reset_token: string, password: string, confirm_password: string): Observable<void> {
    return this.publicPost('/storefront/customer-auth/reset-password', {
      reset_token,
      password,
      confirm_password,
    }).pipe(map(() => undefined));
  }

  /** Protected request for cart, wishlist, addresses, checkout and orders. */
  request<T>(method: Method, path: string, body?: unknown): Observable<T> {
    return this.requestRaw<ApiResponse<T>>(method, path, body).pipe(map((response) => response.data));
  }

  /** Same as request(), but returns the whole body (paged list metadata lives there). */
  requestRaw<T>(method: Method, path: string, body?: unknown): Observable<T> {
    return this.sendRaw<T>(method, path, body).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401 || !this.session$.value?.refresh_token) return throwError(() => error);
        return this.refresh().pipe(
          switchMap(() => this.sendRaw<T>(method, path, body)),
          catchError(() => {
            this.clear();
            return throwError(() => error);
          }),
        );
      }),
    );
  }

  /** Re-loads the profile after an update (keeps the same tokens). */
  reloadMe(): void {
    if (!this.isLoggedIn) return;
    this.request<CustomerUser>('GET', '/storefront/customer-auth/me').subscribe({
      next: (customer) => this.patchCustomer(customer),
      error: () => undefined,
    });
  }

  /** Message from an API error, including Joi field errors. */
  static errorMessage(error: HttpErrorResponse, fallback = 'Something went wrong. Please try again.'): string {
    const body = error?.error;
    if (body?.errors?.length) return body.errors[0];
    return body?.message || fallback;
  }

  private sendRaw<T>(method: Method, path: string, body?: unknown): Observable<T> {
    return this.http.request<T>(method, `${this.baseUrl}${path}`, {
      body,
      headers: this.authHeaders(),
      params: this.tenantParams(),
    });
  }

  private publicPost<T = unknown>(path: string, body: unknown): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, {
        params: this.tenantParams(),
      })
      .pipe(map((response) => response.data));
  }

  private refresh(): Observable<void> {
    if (!this.refreshInFlight) {
      const refresh_token = this.session$.value?.refresh_token;
      this.refreshInFlight = this.http
        .post<ApiResponse<{ token: string; refresh_token: string }>>(
          `${this.baseUrl}/storefront/customer-auth/refresh`,
          { refresh_token },
          { params: this.tenantParams() },
        )
        .pipe(
          map((response) => response.data),
          tap((tokens) => {
            const current = this.session$.value;
            if (current) this.save({ ...current, ...tokens });
          }),
          map(() => undefined),
          finalize(() => (this.refreshInFlight = undefined)),
          shareReplay(1),
        );
    }
    return this.refreshInFlight;
  }

  private authHeaders(): Record<string, string> {
    const token = this.session$.value?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private tenantParams(): HttpParams {
    let params = new HttpParams();
    if (this.shop.slug) params = params.set('tenant', this.shop.slug);
    return params;
  }

  private read(): CustomerSession | null {
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CustomerSession;
      return parsed?.token ? parsed : null;
    } catch {
      return null;
    }
  }

  private save(session: CustomerSession): void {
    this.session$.next(session);
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(session));
    } catch {
      // storage blocked: the in-memory session still works for this tab
    }
  }

  private patchCustomer(customer: CustomerUser): void {
    const current = this.session$.value;
    if (!current) return;
    this.save({ ...current, customer: { ...current.customer, ...customer } });
  }

  private clear(): void {
    this.session$.next(null);
    try {
      localStorage.removeItem(this.storageKey());
    } catch {
      // ignore
    }
  }

  private storageKey(): string {
    return `sf.session:${this.shop.slug || 'default'}`;
  }
}
