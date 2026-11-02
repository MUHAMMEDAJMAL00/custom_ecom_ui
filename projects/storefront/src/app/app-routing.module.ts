import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BrandsPageComponent } from './features/catalog/brands-page.component';
import { CatalogPageComponent } from './features/catalog/catalog-page.component';
import { ProductPageComponent } from './features/catalog/product-page.component';
import { HomeComponent } from './features/home/home.component';
import { StorefrontFeatureGuard } from './core/guards/storefront-feature.guard';
import { CustomerAuthGuard } from './core/guards/customer-auth.guard';
import { AuthPageComponent } from './features/account/auth-page.component';
import { AccountPageComponent } from './features/account/account-page.component';
import { AddressesPageComponent } from './features/account/addresses-page.component';
import { OrdersPageComponent } from './features/account/orders-page.component';
import { OrderDetailPageComponent } from './features/account/order-detail-page.component';
import { CartPageComponent } from './features/cart/cart-page.component';
import { CheckoutPageComponent } from './features/checkout/checkout-page.component';
import { OrderSuccessPageComponent } from './features/checkout/order-success-page.component';
import { WishlistPageComponent } from './features/wishlist/wishlist-page.component';
import { CmsPageComponent } from './features/cms/cms-page.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'catalog', component: CatalogPageComponent, data: { mode: 'all' } },
  { path: 'catalog/category/:slug', component: CatalogPageComponent, data: { mode: 'category' } },
  { path: 'catalog/search', component: CatalogPageComponent, data: { mode: 'search' } },
  { path: 'catalog/brands', component: BrandsPageComponent },
  { path: 'catalog/brand/:slug', component: CatalogPageComponent, data: { mode: 'brand' } },
  { path: 'catalog/product/:ref', component: ProductPageComponent },
  // Older product links: /catalog/product/<slug>/<public id>
  { path: 'catalog/product/:slug/:ref', component: ProductPageComponent },

  { path: 'login', component: AuthPageComponent, data: { mode: 'login' } },
  { path: 'signup', component: AuthPageComponent, data: { mode: 'signup' } },
  { path: 'forgot-password', component: AuthPageComponent, data: { mode: 'forgot' } },

  { path: 'cart', component: CartPageComponent },
  {
    path: 'wishlist',
    component: WishlistPageComponent,
    canActivate: [StorefrontFeatureGuard],
    data: { feature: 'wishlist' },
  },
  { path: 'checkout', component: CheckoutPageComponent, canActivate: [CustomerAuthGuard] },
  { path: 'checkout/success/:id', component: OrderSuccessPageComponent, canActivate: [CustomerAuthGuard] },

  { path: 'account', component: AccountPageComponent, canActivate: [CustomerAuthGuard] },
  { path: 'my-orders', component: OrdersPageComponent, canActivate: [CustomerAuthGuard] },
  { path: 'my-orders/:id', component: OrderDetailPageComponent, canActivate: [CustomerAuthGuard] },
  { path: 'addresses', component: AddressesPageComponent, canActivate: [CustomerAuthGuard] },

  { path: 'pages/:slug', component: CmsPageComponent },

  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
