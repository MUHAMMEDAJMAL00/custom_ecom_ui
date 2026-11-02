import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './shop/core/interceptors/error.interceptor';
import { SharedModule } from './shop/shared/shared.module';
import { ShopHeaderComponent } from './shop/layout/header/shop-header.component';
import { ShopSidebarComponent } from './shop/layout/sidebar/shop-sidebar.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuditLogComponent } from './features/platform-admin/audit-log/audit-log.component';
import { ModuleCatalogueComponent } from './features/platform-admin/module-catalogue/module-catalogue.component';
import { PlatformRolesComponent } from './features/platform-admin/platform-roles/platform-roles.component';
import { PlatformUsersComponent } from './features/platform-admin/platform-users/platform-users.component';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { TenantDashboardComponent } from './features/tenant-dashboard/tenant-dashboard.component';
import { TenantLoginComponent } from './features/tenant-auth/tenant-login/tenant-login.component';
import { TenantModulePageComponent } from './features/tenant-module-page/tenant-module-page.component';
import { TrustSvgPipe } from './core/pipes/trust-svg.pipe';
import { TenantCreateComponent } from './features/tenants/tenant-create/tenant-create.component';
import { TenantDomainsComponent } from './features/tenants/tenant-domains/tenant-domains.component';
import { TenantEditComponent } from './features/tenants/tenant-edit/tenant-edit.component';
import { TenantListComponent } from './features/tenants/tenant-list/tenant-list.component';
import { TenantModulesComponent } from './features/tenants/tenant-modules/tenant-modules.component';
import { HeaderComponent } from './layout/header/header.component';
import { ShellComponent } from './layout/shell/shell.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TenantShellComponent } from './layout/tenant-shell/tenant-shell.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ShellComponent,
    SidebarComponent,
    HeaderComponent,
    DashboardComponent,
    ModuleCatalogueComponent,
    PlatformUsersComponent,
    PlatformRolesComponent,
    AuditLogComponent,
    TenantListComponent,
    TenantCreateComponent,
    TenantDomainsComponent,
    TenantEditComponent,
    TenantModulesComponent,
    TenantLoginComponent,
    TenantShellComponent,
    TenantDashboardComponent,
    TenantModulePageComponent,
    TrustSvgPipe,
    ShopSidebarComponent,
    ShopHeaderComponent,
    NotFoundComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
