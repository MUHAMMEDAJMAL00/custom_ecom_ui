import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TenantNavLeaf } from '../../layout/tenant-nav-config';

/** Stand-in for a Tenant Admin screen that is not ported from MySkin yet. */
@Component({
  selector: 'app-tenant-module-page',
  standalone: false,
  templateUrl: './tenant-module-page.component.html',
  styleUrls: ['./tenant-module-page.component.scss'],
})
export class TenantModulePageComponent {
  readonly leaf: TenantNavLeaf | undefined;
  readonly slug: string;

  constructor(route: ActivatedRoute) {
    this.leaf = route.snapshot.data['leaf'];
    this.slug = route.snapshot.parent?.paramMap.get('slug') || '';
  }
}
