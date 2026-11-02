import { Injectable } from '@angular/core';
import { PlatformUser } from '../models/auth.model';
import { TenantSession, TenantUser } from '../models/tenant-auth.model';

const TOKEN_KEY = 'platform.access_token';
const REFRESH_KEY = 'platform.refresh_token';
const USER_KEY = 'platform.user';
const TENANT_SESSION_KEY = 'tenant.session';
const TENANT_SLUG_KEY = 'tenant.active_slug';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  get user(): PlatformUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlatformUser;
    } catch {
      return null;
    }
  }

  save(token: string, refreshToken: string, user: PlatformUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  saveUser(user: PlatformUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ─── Tenant session ────────────────────────────────────────────────────────
  get tenantSession(): TenantSession | null {
    const raw = localStorage.getItem(TENANT_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TenantSession;
    } catch {
      return null;
    }
  }

  get tenantSlug(): string | null {
    return localStorage.getItem(TENANT_SLUG_KEY);
  }

  get tenantUser(): TenantUser | null {
    return this.tenantSession?.user ?? null;
  }

  saveTenantSlug(slug: string): void {
    localStorage.setItem(TENANT_SLUG_KEY, slug);
  }

  saveTenantSession(session: TenantSession): void {
    localStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(TENANT_SLUG_KEY, session.tenant.slug);
  }

  clearTenantSession(): void {
    localStorage.removeItem(TENANT_SESSION_KEY);
  }

  clearTenant(): void {
    localStorage.removeItem(TENANT_SESSION_KEY);
    localStorage.removeItem(TENANT_SLUG_KEY);
  }
}
