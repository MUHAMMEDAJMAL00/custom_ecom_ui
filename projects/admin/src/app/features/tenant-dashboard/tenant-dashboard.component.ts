import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  TenantModule,
  TenantSession,
  TenantUser,
} from '../../core/models/tenant-auth.model';
import { TenantAuthService } from '../../core/services/tenant-auth.service';
import { environment } from '../../../environments/environment';

interface ModuleGroupView {
  name: string;
  modules: TenantModule[];
}

interface PasswordFormControls {
  current_password: FormControl<string>;
  new_password: FormControl<string>;
  confirm_password: FormControl<string>;
}

const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const next = group.get('new_password')?.value;
  const confirm = group.get('confirm_password')?.value;
  return next && confirm && next !== confirm ? { mismatch: true } : null;
};

@Component({
  selector: 'app-tenant-dashboard',
  standalone: false,
  templateUrl: './tenant-dashboard.component.html',
  styleUrls: ['./tenant-dashboard.component.scss'],
})
export class TenantDashboardComponent implements OnInit, OnDestroy {
  slug = '';
  session: TenantSession | null = null;
  user: TenantUser | null = null;

  modules: TenantModule[] = [];
  moduleGroups: ModuleGroupView[] = [];
  moduleLoading = true;
  moduleError = '';

  readonly passwordForm: FormGroup<PasswordFormControls>;

  changingPassword = false;
  passwordError = '';
  passwordSuccess = '';

  private readonly subscriptions = new Subscription();

  constructor(
    private fb: NonNullableFormBuilder,
    private route: ActivatedRoute,
    private auth: TenantAuthService,
  ) {
    this.passwordForm = this.fb.group(
      {
        current_password: ['', [Validators.required]],
        new_password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
        confirm_password: ['', [Validators.required]],
      },
      { validators: passwordsMatch },
    );
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.parent?.params['slug'] || '';
    this.subscriptions.add(
      this.auth.session$.subscribe((session) => {
        this.session = session;
        this.user = session?.user ?? null;
      }),
    );
    this.loadModules();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get tenantName(): string {
    return this.session?.tenant.name || this.slug;
  }

  get enabledCount(): number {
    return this.modules.length;
  }

  /** Shortcuts to the most used screens, only those this shop and user can open. */
  get quickActions(): { label: string; hint: string; icon: string; path: string }[] {
    const all = [
      { label: 'Add product', hint: 'Products', icon: 'bi-box-seam', path: 'products', module: 'catalog', permission: 'products:read' },
      { label: 'Categories', hint: 'Organise the catalogue', icon: 'bi-grid', path: 'categories', module: 'categories', permission: 'categories:read' },
      { label: 'Home banners', hint: 'Storefront hero', icon: 'bi-image', path: 'website/banners', module: 'home_banners', permission: 'banners:read' },
      { label: 'Theme & colours', hint: 'Look of the shop', icon: 'bi-palette', path: 'website/theme', module: 'website', permission: 'home_sections:read' },
      { label: 'Online orders', hint: 'From the storefront', icon: 'bi-bag-check', path: 'sales/online-orders', module: 'online_orders', permission: 'sales:read' },
      { label: 'Staff users', hint: 'Who can sign in', icon: 'bi-people', path: 'users', module: 'staff', permission: 'users:read' },
      { label: 'Settings', hint: 'Business details', icon: 'bi-gear', path: 'settings', module: 'settings', permission: 'config:read' },
    ];
    return all.filter((a) => this.auth.canOpen(a.module, a.permission));
  }

  get storeCount(): number {
    return this.user?.stores.length ?? 0;
  }

  get storefrontUrl(): string {
    return environment.production
      ? `https://${this.slug}.${environment.rootDomain}`
      : `http://localhost:4300/?tenant=${this.slug}`;
  }

  loadModules(): void {
    this.moduleLoading = true;
    this.moduleError = '';

    this.auth.modules(this.slug).subscribe({
      next: (modules) => {
        this.modules = modules.filter((mod) => mod.enabled);
        this.moduleGroups = this.groupModules(this.modules);
        this.moduleLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.moduleLoading = false;
        this.moduleError = error.error?.message || 'Could not load this shop’s modules.';
      },
    });
  }

  requiresLabel(mod: TenantModule): string {
    return mod.depends_on
      .map((key) => this.modules.find((item) => item.key === key)?.label || key)
      .join(', ');
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.getRawValue();
    this.changingPassword = true;

    this.auth
      .changePassword(
        this.slug,
        value.current_password,
        value.new_password,
        value.confirm_password,
      )
      .subscribe({
        next: () => {
          this.changingPassword = false;
          this.passwordSuccess = 'Password changed. Your session has been refreshed.';
          this.passwordForm.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.changingPassword = false;
          this.passwordError =
            error.error?.message || 'Could not change the password. Check the current one.';
        },
      });
  }

  private groupModules(modules: TenantModule[]): ModuleGroupView[] {
    const groups = new Map<string, TenantModule[]>();
    for (const mod of modules) {
      const list = groups.get(mod.group) ?? [];
      list.push(mod);
      groups.set(mod.group, list);
    }
    return [...groups.entries()].map(([name, list]) => ({ name, modules: list }));
  }
}
