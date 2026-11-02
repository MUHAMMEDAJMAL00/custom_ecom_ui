import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PlatformUser } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: false,
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit, OnDestroy {
  sidebarOpen = false;
  pageTitle = 'Dashboard';
  pageSubtitle = 'Platform health and recent activity';

  readonly user$: Observable<PlatformUser | null>;
  private readonly subscriptions = new Subscription();

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    this.user$ = this.auth.currentUser$;
  }

  ngOnInit(): void {
    this.auth.me().subscribe({ error: () => undefined });

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.sidebarOpen = false;
          this.updateHeading(event.urlAfterRedirects);
        }),
    );

    this.updateHeading(this.router.url);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.subscriptions.add(
      this.auth.logout().subscribe(() => {
        void this.router.navigate(['/platform/login']);
      }),
    );
  }

  private updateHeading(url: string): void {
    if (url.startsWith('/platform/tenants/new')) {
      this.pageTitle = 'Create shop';
      this.pageSubtitle = 'Set up a new shop';
      return;
    }

    if (/^\/platform\/tenants\/\d+\/edit/.test(url)) {
      this.pageTitle = 'Edit shop';
      this.pageSubtitle = 'Shop profile and regional settings';
      return;
    }

    if (/^\/platform\/tenants\/\d+\/modules/.test(url)) {
      this.pageTitle = 'Shop modules';
      this.pageSubtitle = 'Feature entitlements for this shop';
      return;
    }

    if (url.startsWith('/platform/tenants')) {
      this.pageTitle = 'Shops';
      this.pageSubtitle = 'Every shop on the platform';
      return;
    }

    if (url.startsWith('/platform/modules')) {
      this.pageTitle = 'Module catalogue';
      this.pageSubtitle = 'Display and availability of platform modules';
      return;
    }

    if (url.startsWith('/platform/roles')) {
      this.pageTitle = 'Roles & permissions';
      this.pageSubtitle = 'Super Admin access control';
      return;
    }

    if (url.startsWith('/platform/users')) {
      this.pageTitle = 'Platform users';
      this.pageSubtitle = 'Super Admin accounts';
      return;
    }

    if (url.startsWith('/platform/audit-log')) {
      this.pageTitle = 'Audit log';
      this.pageSubtitle = 'Sensitive platform actions';
      return;
    }

    this.pageTitle = 'Dashboard';
    this.pageSubtitle = 'Platform health and recent activity';
  }
}
