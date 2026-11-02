import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { TenantNavLeaf, flattenTenantNav } from '../../layout/tenant-nav-config';
import { TenantAuthService } from '../services/tenant-auth.service';

/**
 * Blocks a tenant screen whose module is off or whose permission is missing. The nav
 * item is found from the URL (longest matching path), so it also covers the child
 * pages of lazy MySkin modules such as /website/theme.
 */
@Injectable({ providedIn: 'root' })
export class TenantModuleGuard implements CanActivate, CanActivateChild {
  constructor(
    private auth: TenantAuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.check(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.check(state.url);
  }

  private check(url: string): boolean | UrlTree {
    const match = url.split(/[?#]/)[0].match(/^\/t\/([^/]+)\/(.*)$/);
    if (!match) return true;
    const [, slug, path] = match;
    const leaf = this.leafFor(path);
    if (!leaf || this.auth.canOpen(leaf.module, leaf.permission)) return true;
    return this.router.createUrlTree(['/t', slug, 'overview']);
  }

  private leafFor(path: string): TenantNavLeaf | undefined {
    return flattenTenantNav()
      .filter((leaf) => path === leaf.path || path.startsWith(leaf.path + '/'))
      .sort((a, b) => b.path.length - a.path.length)[0];
  }
}
