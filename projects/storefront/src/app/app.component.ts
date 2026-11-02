import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ShopContextService } from './core/services/shop-context.service';
import { ShopNavService } from './core/services/shop-nav.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor(
    readonly nav: ShopNavService,
    shop: ShopContextService,
    router: Router,
  ) {
    router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      // Locally the shop comes from ?tenant=<slug>: keep it in the address bar on every
      // page so links can be copied and reloaded.
      if (!environment.production && shop.slug && !e.urlAfterRedirects.includes('tenant=')) {
        void router.navigate([], { queryParams: { tenant: shop.slug }, queryParamsHandling: 'merge', replaceUrl: true });
      }
      if (!e.urlAfterRedirects.includes('#')) window.scrollTo({ top: 0 });
    });
  }
}
