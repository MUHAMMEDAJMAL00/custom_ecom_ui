import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class PlatformAuthGuard implements CanActivate {
  constructor(
    private storage: TokenStorageService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.storage.token) return true;
    return this.router.createUrlTree(['/platform/login']);
  }
}
