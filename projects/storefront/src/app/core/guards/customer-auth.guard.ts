import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { CustomerAuthService } from '../services/customer-auth.service';

/** Signed-in customers only; sends guests to /login and returns them afterwards. */
@Injectable({ providedIn: 'root' })
export class CustomerAuthGuard implements CanActivate {
  constructor(
    private auth: CustomerAuthService,
    private router: Router,
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.auth.isLoggedIn) return true;
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}
