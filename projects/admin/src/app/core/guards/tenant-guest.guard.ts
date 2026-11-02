import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { TenantAuthService } from '../services/tenant-auth.service';

@Injectable({ providedIn: 'root' })
export class TenantGuestGuard implements CanActivate {
  constructor(
    private auth: TenantAuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const slug = route.paramMap.get('slug');
    if (slug && this.auth.isSessionFor(slug)) {
      return this.router.createUrlTree(['/t', slug, 'dashboard']);
    }
    return true;
  }
}
