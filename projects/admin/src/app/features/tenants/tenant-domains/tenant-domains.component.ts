import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TenantDetail, TenantDomain } from '../../../core/models/tenant.model';
import { ApiService } from '../../../core/services/api.service';

const DOMAIN_PATTERN = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

@Component({
  selector: 'app-tenant-domains',
  standalone: false,
  templateUrl: './tenant-domains.component.html',
  styleUrls: ['./tenant-domains.component.scss'],
})
export class TenantDomainsComponent implements OnInit {
  tenantId = 0;
  tenant: TenantDetail | null = null;

  readonly form: FormGroup<{ domain: FormControl<string> }>;

  loading = true;
  errorMessage = '';
  successMessage = '';

  adding = false;
  actionId: number | null = null;
  actionError = '';

  readonly rootDomain = environment.rootDomain;

  constructor(
    private fb: NonNullableFormBuilder,
    private route: ActivatedRoute,
    private api: ApiService,
  ) {
    this.form = this.fb.group({
      domain: ['', [Validators.required, Validators.pattern(DOMAIN_PATTERN)]],
    });
  }

  ngOnInit(): void {
    this.tenantId = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
    this.load();
  }

  get subdomain(): TenantDomain | null {
    return this.tenant?.domains.find((domain) => domain.type === 'subdomain') ?? null;
  }

  get customDomains(): TenantDomain[] {
    return this.tenant?.domains.filter((domain) => domain.type !== 'subdomain') ?? [];
  }

  get primaryDomain(): TenantDomain | null {
    return this.tenant?.domains.find((domain) => domain.is_primary) ?? null;
  }

  get publicBase(): string {
    const domain = this.primaryDomain?.domain;
    return domain ? `https://${domain}` : '';
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<TenantDetail>(`/platform/tenants/${this.tenantId}`).subscribe({
      next: (tenant) => {
        this.tenant = tenant;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load this shop.';
      },
    });
  }

  addDomain(): void {
    this.actionError = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.adding = true;
    const domain = this.form.controls.domain.value.trim().toLowerCase();

    this.api.post<TenantDomain>(`/platform/tenants/${this.tenantId}/domains`, { domain }).subscribe({
      next: () => {
        this.adding = false;
        this.form.reset();
        this.successMessage = `${domain} added. Add the DNS records below, then verify.`;
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.adding = false;
        this.actionError = error.error?.message || 'Could not add this domain.';
      },
    });
  }

  verify(domain: TenantDomain): void {
    this.runAction(domain.id, () =>
      this.api.post<TenantDomain>(
        `/platform/tenants/${this.tenantId}/domains/${domain.id}/verify`,
      ),
    );
  }

  makePrimary(domain: TenantDomain): void {
    this.runAction(domain.id, () =>
      this.api.patch<TenantDomain>(
        `/platform/tenants/${this.tenantId}/domains/${domain.id}`,
        { is_primary: true },
      ),
    );
  }

  remove(domain: TenantDomain): void {
    if (!window.confirm(`Remove ${domain.domain} from this shop?`)) return;
    this.runAction(domain.id, () =>
      this.api.delete<{ message: string }>(
        `/platform/tenants/${this.tenantId}/domains/${domain.id}`,
      ),
    );
  }

  dnsRecords(domain: TenantDomain): { type: string; name: string; value: string }[] {
    if (domain.type === 'subdomain') return [];
    return [
      { type: 'CNAME', name: domain.domain, value: `tenants.${this.rootDomain}` },
      {
        type: 'TXT',
        name: `_platform-verify.${domain.domain}`,
        value: domain.verify_token || 'generated after adding the domain',
      },
    ];
  }

  isInvalid(): boolean {
    const control = this.form.controls.domain;
    return control.invalid && (control.dirty || control.touched);
  }

  statusLabel(domain: TenantDomain): string {
    if (domain.verified_at) return 'Verified';
    return 'Pending DNS';
  }

  private runAction(id: number, action: () => Observable<unknown>): void {
    this.actionId = id;
    this.actionError = '';
    this.successMessage = '';

    action().subscribe({
      next: () => {
        this.actionId = null;
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.actionId = null;
        this.actionError = error.error?.message || 'The domain action failed.';
      },
    });
  }
}
