import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ShopContextService } from '../services/shop-context.service';

/** Blocks pages whose storefront module is disabled for the shop. */
@Injectable({ providedIn: 'root' })
export class StorefrontFeatureGuard implements CanActivate {
  constructor(
    private shop: ShopContextService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const feature = route.data['feature'] as string | undefined;
    if (!feature) return of(true);

    return this.shop.load().pipe(
      map((ctx) =>
        ctx.bootstrap.features[feature] === true
          ? true
          : this.router.createUrlTree(['/']),
      ),
      catchError(() => of(this.router.createUrlTree(['/']))),
    );
  }
}
