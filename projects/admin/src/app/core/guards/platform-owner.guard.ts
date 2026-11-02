import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/** Roles and platform-user management are Super Admin only. */
@Injectable({ providedIn: 'root' })
export class PlatformOwnerGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    const deny = this.router.createUrlTree(['/platform']);
    const user = this.auth.currentUser;

    if (user) return of(user.role === 'platform_owner' ? true : deny);

    return this.auth.me().pipe(
      map((fresh) => (fresh.role === 'platform_owner' ? true : deny)),
      catchError(() => of(deny)),
    );
  }
}
