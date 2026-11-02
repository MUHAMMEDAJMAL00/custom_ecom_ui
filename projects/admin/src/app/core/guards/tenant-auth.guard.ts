import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { TenantAuthService } from '../services/tenant-auth.service';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class TenantAuthGuard implements CanActivate {
  constructor(
    private auth: TenantAuthService,
    private storage: TokenStorageService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const slug = route.paramMap.get('slug') || this.storage.tenantSlug;
    if (!slug) return this.router.createUrlTree(['/platform/login']);
    if (this.auth.isSessionFor(slug)) return true;
    return this.router.createUrlTree(['/t', slug, 'login']);
  }
}
