import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import {
  LoginCredentials,
  PlatformSession,
  PlatformUser,
} from '../models/auth.model';
import { ApiService } from './api.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject: BehaviorSubject<PlatformUser | null>;
  readonly currentUser$: Observable<PlatformUser | null>;

  constructor(
    private api: ApiService,
    private storage: TokenStorageService,
  ) {
    this.currentUserSubject = new BehaviorSubject<PlatformUser | null>(
      this.storage.user,
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  get currentUser(): PlatformUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.storage.token;
  }

  hasPermission(module: string, action: string): boolean {
    const permissions = this.currentUser?.permissions ?? [];
    return permissions.includes('*') || permissions.includes(`${module}:${action}`);
  }

  get isPlatformOwner(): boolean {
    return this.currentUser?.role === 'platform_owner';
  }

  login(credentials: LoginCredentials): Observable<PlatformUser> {
    return this.api
      .post<PlatformSession>('/platform/auth/login', credentials)
      .pipe(
        tap((session) => {
          this.storage.save(session.token, session.refresh_token, session.user);
          this.currentUserSubject.next(session.user);
        }),
        map((session) => session.user),
      );
  }

  me(): Observable<PlatformUser> {
    return this.api.get<PlatformUser>('/platform/auth/me').pipe(
      tap((user) => {
        this.storage.saveUser(user);
        this.currentUserSubject.next(user);
      }),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.storage.refreshToken;
    return this.api
      .post<void>('/platform/auth/logout', { refresh_token: refreshToken })
      .pipe(
        catchError(() => of(undefined)),
        map(() => undefined),
        finalize(() => this.clearSession()),
      );
  }

  clearSession(): void {
    this.storage.clear();
    this.currentUserSubject.next(null);
  }
}
