import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Observable, Subscription, fromEvent, interval, merge } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';
import { TenantSession } from '../../core/models/tenant-auth.model';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { TokenStorageService } from '../../core/services/token-storage.service';
import { flattenTenantNav } from '../tenant-nav-config';

/** Shop admin shell: the MySkin admin layout (sidebar, topbar, content area). */
@Component({
  selector: 'app-tenant-shell',
  standalone: false,
  templateUrl: './tenant-shell.component.html',
  styleUrls: ['./tenant-shell.component.scss'],
})
export class TenantShellComponent implements OnInit, OnDestroy {
  slug = '';
  sidebarOpen = false;
  collapsed = false;

  readonly session$: Observable<TenantSession | null>;
  private readonly subscriptions = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: TenantAuthService,
    private storage: TokenStorageService,
  ) {
    this.session$ = this.auth.session$;
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || this.storage.tenantSlug || '';

    if (this.slug) {
      this.auth.me(this.slug).subscribe({ error: () => undefined });
    }

    // A temporary password must be changed first (form on the Shop Overview page)
    if (this.auth.user?.must_change_password && !this.router.url.endsWith('/overview')) {
      void this.router.navigate(['/t', this.slug, 'overview']);
    }

    // Modules can be switched on/off from the platform at any time: re-read them when the
    // tab regains focus and every minute, so the sidebar and guards follow without a reload.
    this.subscriptions.add(
      merge(fromEvent(window, 'focus'), interval(60_000))
        .pipe(throttleTime(5_000))
        .subscribe(() => this.refreshSession()),
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(() => (this.sidebarOpen = false)),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Re-reads user, modules and permissions; leaves a screen whose module was switched off. */
  private refreshSession(): void {
    if (!this.slug) return;
    this.auth.me(this.slug).subscribe({
      next: () => {
        const match = this.router.url.split(/[?#]/)[0].match(/^\/t\/[^/]+\/(.*)$/);
        const path = match?.[1] ?? '';
        const leaf = flattenTenantNav()
          .filter((item) => path === item.path || path.startsWith(item.path + '/'))
          .sort((a, b) => b.path.length - a.path.length)[0];
        if (leaf && !this.auth.canOpen(leaf.module, leaf.permission)) {
          void this.router.navigate(['/t', this.slug, 'overview']);
        }
      },
      error: () => undefined,
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.subscriptions.add(
      this.auth.logout(this.slug).subscribe(() => {
        void this.router.navigate(['/t', this.slug, 'login']);
      }),
    );
  }
}
