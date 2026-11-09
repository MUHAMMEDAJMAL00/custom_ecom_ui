import { provideHttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClassicFooterComponent } from './features/classic/footer/classic-footer.component';
import { ClassicHeaderComponent } from './features/classic/header/classic-header.component';
import { ClassicHomeComponent } from './features/classic/home/classic-home.component';
import { BrandsPageComponent } from './features/catalog/brands-page.component';
import { CatalogPageComponent } from './features/catalog/catalog-page.component';
import { ProductCardComponent } from './features/catalog/product-card.component';
import { ProductPageComponent } from './features/catalog/product-page.component';
import { ShopShellComponent } from './features/catalog/shop-shell.component';
import { ElectroFooterComponent } from './features/electro/electro-footer.component';
import { ElectroHeaderComponent } from './features/electro/electro-header.component';
import { ElectroHomeComponent } from './features/electro/electro-home.component';
import { HomeComponent } from './features/home/home.component';
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

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ClassicHomeComponent,
    ClassicHeaderComponent,
    ClassicFooterComponent,
    ShopShellComponent,
    ElectroHeaderComponent,
    ElectroFooterComponent,
    ElectroHomeComponent,
    ProductCardComponent,
    CatalogPageComponent,
    ProductPageComponent,
    BrandsPageComponent,
    AuthPageComponent,
    AccountPageComponent,
    AddressesPageComponent,
    OrdersPageComponent,
    OrderDetailPageComponent,
    CartPageComponent,
    CheckoutPageComponent,
    OrderSuccessPageComponent,
    WishlistPageComponent,
    CmsPageComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule {}
