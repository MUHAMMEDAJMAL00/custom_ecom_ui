import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { TenantSession } from '../../../core/models/tenant-auth.model';
import { TenantAuthService } from '../../../core/services/tenant-auth.service';
import { TENANT_NAV, TenantNavGroup } from '../../../layout/tenant-nav-config';

// MySkin admin core/layout/sidebar, driven by tenant-nav-config.ts: an item shows only
// when its module is on for the shop and the user holds its permission.

@Component({
  selector: 'app-shop-sidebar',
  standalone: false,
  templateUrl: './shop-sidebar.component.html',
  styleUrl: './shop-sidebar.component.css',
})
export class ShopSidebarComponent implements OnChanges {
  @Input({ required: true }) session!: TenantSession;
  @Input() slug = '';
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() navigated = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  navGroups: TenantNavGroup[] = [];
  /** Exact path match, so Stock Management is not lit on Batch Tracking. */
  readonly exactMatch = { paths: 'exact', queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored' } as const;
  openGroupId: string | null = null;

  constructor(private auth: TenantAuthService) {}

  ngOnChanges(): void {
    this.navGroups = TENANT_NAV.map((group) => ({
      ...group,
      children: group.children.filter((leaf) => this.auth.canOpen(leaf.module, leaf.permission)),
    })).filter((group) => group.children.length > 0);
  }

  get initial(): string {
    return this.session.tenant.name.charAt(0).toUpperCase();
  }

  toggleGroup(groupId: string): void {
    this.openGroupId = this.openGroupId === groupId ? null : groupId;
  }

  onNavClick(): void {
    this.navigated.emit();
  }
}
