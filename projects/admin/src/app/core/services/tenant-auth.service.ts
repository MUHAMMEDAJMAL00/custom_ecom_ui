import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import {
  TenantBootstrap,
  TenantLoginCredentials,
  TenantModule,
  TenantProfile,
  TenantSession,
  TenantUser,
} from '../models/tenant-auth.model';
import { ApiService } from './api.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class TenantAuthService {
  private readonly sessionSubject: BehaviorSubject<TenantSession | null>;
  readonly session$: Observable<TenantSession | null>;

  constructor(
    private api: ApiService,
    private storage: TokenStorageService,
  ) {
    this.sessionSubject = new BehaviorSubject<TenantSession | null>(
      this.storage.tenantSession,
    );
    this.session$ = this.sessionSubject.asObservable();
  }

  get session(): TenantSession | null {
    return this.sessionSubject.value;
  }

  get user(): TenantUser | null {
    return this.sessionSubject.value?.user ?? null;
  }

  get tenant() {
    return this.sessionSubject.value?.tenant ?? null;
  }

  login(slug: string, credentials: TenantLoginCredentials): Observable<TenantSession> {
    return this.api
      .post<TenantSession>('/auth/login', credentials, { 'X-Tenant': slug })
      .pipe(tap((session) => this.saveSession(slug, session)));
  }

  bootstrap(slug: string): Observable<TenantBootstrap> {
    return this.api.get<TenantBootstrap>('/storefront/bootstrap', { tenant: slug });
  }

  /** Refreshes user, tenant and module keys using the stored tenant token. */
  me(slug: string): Observable<TenantSession> {
    const stored = this.storage.tenantSession;
    return this.api
      .get<TenantProfile>('/auth/me', undefined, { 'X-Tenant': slug })
      .pipe(
        map((profile) => ({
          token: stored?.token ?? '',
          refresh_token: stored?.refresh_token ?? '',
          ...profile,
        })),
        tap((session) => this.saveSession(slug, session)),
      );
  }

  modules(slug: string): Observable<TenantModule[]> {
    return this.api.get<TenantModule[]>('/modules', undefined, { 'X-Tenant': slug });
  }

  changePassword(
    slug: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Observable<TenantSession> {
    return this.api
      .post<TenantSession>(
        '/auth/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        { 'X-Tenant': slug },
      )
      .pipe(tap((session) => this.saveSession(slug, session)));
  }

  logout(slug: string): Observable<void> {
    const refreshToken = this.storage.tenantSession?.refresh_token ?? '';
    return this.api
      .post<void>(
        '/auth/logout',
        { refresh_token: refreshToken },
        { 'X-Tenant': slug },
      )
      .pipe(
        catchError(() => of(undefined)),
        map(() => undefined),
        finalize(() => this.clearSession()),
      );
  }

  isSessionFor(slug: string): boolean {
    const session = this.storage.tenantSession;
    return !!session?.token && session.tenant.slug === slug;
  }

  hasModule(key: string): boolean {
    return this.session?.modules.includes(key) ?? false;
  }

  hasPermission(key: string): boolean {
    const user = this.user;
    if (!user) return false;
    if (user.full_access) return true;
    return user.permissions[key] === true;
  }

  /** Module check first (no role skips it), then the permission (if any). */
  canOpen(module: string, permission?: string): boolean {
    if (!this.hasModule(module)) return false;
    return !permission || this.hasPermission(permission);
  }

  clearSession(): void {
    this.storage.clearTenantSession();
    this.sessionSubject.next(null);
  }

  private saveSession(slug: string, session: TenantSession): void {
    this.storage.saveTenantSlug(slug);
    this.storage.saveTenantSession(session);
    this.sessionSubject.next(session);
  }
}
