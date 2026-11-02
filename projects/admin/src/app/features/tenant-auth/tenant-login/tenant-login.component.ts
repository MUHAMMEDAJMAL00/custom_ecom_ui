import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TenantBootstrap } from '../../../core/models/tenant-auth.model';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { TokenStorageService } from '../../../core/services/token-storage.service';

@Component({
  selector: 'app-tenant-login',
  standalone: false,
  templateUrl: './tenant-login.component.html',
  styleUrls: ['./tenant-login.component.scss'],
})
export class TenantLoginComponent implements OnInit {
  readonly form: FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
  }>;

  readonly rootDomain = environment.rootDomain;
  slug = '';
  tenantInput = '';
  needsTenant = false;

  branding: TenantBootstrap | null = null;
  brandingLoading = true;
  brandingError = '';

  submitting = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: NonNullableFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: TenantAuthService,
    private storage: TokenStorageService,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    this.slug =
      this.route.snapshot.paramMap.get('slug') ||
      this.route.snapshot.queryParamMap.get('tenant') ||
      this.storage.tenantSlug ||
      '';

    if (!this.slug && !environment.production) {
      this.brandingLoading = false;
      this.needsTenant = true;
      return;
    }

    if (this.slug && this.auth.isSessionFor(this.slug)) {
      void this.router.navigate(['/t', this.slug, 'dashboard']);
      return;
    }

    this.storage.saveTenantSlug(this.slug);

    // Opening another shop's login must not keep the previous shop's session.
    const existing = this.storage.tenantSession;
    if (existing && existing.tenant.slug !== this.slug) {
      this.auth.clearSession();
    }

    this.loadBranding();
  }

  openTenant(): void {
    const slug = this.tenantInput.trim().toLowerCase();
    if (!slug) return;

    this.slug = slug;
    this.needsTenant = false;
    this.storage.saveTenantSlug(slug);
    this.auth.clearSession();
    this.loadBranding();
  }

  get tenantName(): string {
    return this.branding?.tenant.name || this.slug;
  }

  get tenantInitial(): string {
    return this.tenantName.charAt(0).toUpperCase();
  }

  get themeVars(): Record<string, string> {
    const theme = this.branding?.theme;
    if (!theme) return {};
    return {
      '--t-primary': theme.primary,
      '--t-dark': theme.primary_dark,
      '--t-tint': theme.tint,
      '--t-bg': theme.background,
      '--t-text': theme.text,
    };
  }

  loadBranding(): void {
    this.brandingLoading = true;
    this.brandingError = '';

    this.auth.bootstrap(this.slug).subscribe({
      next: (data) => {
        this.branding = data;
        this.brandingLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.brandingLoading = false;
        this.brandingError =
          error.error?.message || 'Could not load this shop. Check the address.';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  submit(): void {
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.auth.login(this.slug, this.form.getRawValue()).subscribe({
      next: (session) => {
        this.submitting = false;
        void this.router.navigate(['/t', session.tenant.slug, 'dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage =
          error.error?.message || 'Could not sign in. Check your username and password.';
      },
    });
  }
}
