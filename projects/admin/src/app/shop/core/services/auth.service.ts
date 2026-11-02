import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { AuthUser } from '../models/auth.model';

const ACTIVE_STORE_KEY = 'tenant.active_store_id';

/**
 * MySkin admin's AuthService, backed by the tenant session. Copied MySkin screens call
 * `hasPermission(module, action)`, `currentUser` and `activeStoreId` exactly as before.
 * Owner/Admin (`full_access`) have every permission inside the tenant; module checks
 * already ran before the screen opened (TenantModuleGuard).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session$;

  constructor(private tenantAuth: TenantAuthService) {
    this.session$ = this.tenantAuth.session$.pipe(map((s) => (s ? { token: s.token, user: this.currentUser } : null)));
  }

  get currentUser(): AuthUser | null {
    const user = this.tenantAuth.user;
    return user ? ({ ...user, email: user.email ?? '', phone: user.phone ?? '' } as AuthUser) : null;
  }

  get token(): string | null {
    return this.tenantAuth.session?.token ?? null;
  }

  /** MySkin's global super_admin role does not exist for tenants. */
  get isSuperAdmin(): boolean {
    return false;
  }

  get stores() {
    return this.currentUser?.stores ?? [];
  }

  get activeStoreId(): number | null {
    const stored = parseInt(sessionStorage.getItem(ACTIVE_STORE_KEY) || '', 10);
    if (stored && this.stores.some((s) => s.id === stored)) return stored;
    if (this.currentUser?.store_id) return this.currentUser.store_id;
    const primary = this.stores.find((s) => s.is_primary) ?? this.stores[0];
    return primary?.id ?? null;
  }

  setActiveStore(storeId: number | null): void {
    if (storeId === null) sessionStorage.removeItem(ACTIVE_STORE_KEY);
    else sessionStorage.setItem(ACTIVE_STORE_KEY, String(storeId));
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  hasPermission(module: string, action: string): boolean {
    return this.tenantAuth.hasPermission(`${module}:${action}`);
  }

  hasModule(key: string): boolean {
    return this.tenantAuth.hasModule(key);
  }
}
