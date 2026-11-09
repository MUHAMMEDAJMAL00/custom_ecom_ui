import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface ShopRole {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean | number;
  user_count: number;
}

interface RolePermission {
  id: number;
  module: string;
  action: string;
  description: string | null;
  granted: boolean;
}

interface PermissionRow {
  module: string;
  label: string;
  cells: Record<string, RolePermission | undefined>;
}

const ACTION_ORDER = ['read', 'create', 'update', 'delete'];

/** Shop roles and their permissions on the Super Admin shop edit screen. */
@Component({
  selector: 'app-tenant-roles',
  standalone: false,
  templateUrl: './tenant-roles.component.html',
  styleUrls: ['./tenant-roles.component.scss'],
})
export class TenantRolesComponent implements OnInit {
  @Input({ required: true }) tenantId!: number;
  /** A role was added, renamed or deleted (the users section reloads its role list). */
  @Output() changed = new EventEmitter<void>();

  roles: ShopRole[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  // Add role
  adding = false;
  newName = '';
  newDescription = '';
  copyFrom: number | null = null;
  creating = false;

  // Permission grid of the opened role
  openRole: ShopRole | null = null;
  permissions: RolePermission[] = [];
  granted = new Set<number>();
  permLoading = false;
  permSaving = false;
  permDirty = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  get canEdit(): boolean {
    return this.auth.hasPermission('tenants', 'update');
  }

  get isOwnerOpen(): boolean {
    return this.openRole?.name === 'owner';
  }

  /** Columns: the usual actions first, then any others the shop's modules use. */
  get actions(): string[] {
    const all = new Set(this.permissions.map((p) => p.action));
    return [...ACTION_ORDER.filter((a) => all.has(a)), ...[...all].filter((a) => !ACTION_ORDER.includes(a)).sort()];
  }

  get rows(): PermissionRow[] {
    const map = new Map<string, PermissionRow>();
    for (const p of this.permissions) {
      const row = map.get(p.module) || { module: p.module, label: this.label(p.module), cells: {} };
      row.cells[p.action] = p;
      map.set(p.module, row);
    }
    return [...map.values()];
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<ShopRole[]>(`/platform/tenants/${this.tenantId}/roles`).subscribe({
      next: (roles) => {
        this.roles = roles;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load this shop’s roles.';
      },
    });
  }

  label(name: string): string {
    return name.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  isSystem(role: ShopRole): boolean {
    return !!role.is_system;
  }

  // ── Add role ───────────────────────────────────────────────
  startAdd(): void {
    this.adding = true;
    this.newName = '';
    this.newDescription = '';
    this.copyFrom = this.roles.find((r) => r.name === 'staff')?.id ?? null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  create(): void {
    const name = this.newName.trim();
    if (name.length < 2 || this.creating) return;
    this.creating = true;
    this.errorMessage = '';
    this.api
      .post<ShopRole>(`/platform/tenants/${this.tenantId}/roles`, {
        name,
        description: this.newDescription.trim() || null,
        ...(this.copyFrom ? { copy_from_role_id: this.copyFrom } : { permission_ids: [] }),
      })
      .subscribe({
        next: (role) => {
          this.creating = false;
          this.adding = false;
          this.successMessage = `Role “${role.name}” created. Tick its permissions below, then save.`;
          this.changed.emit();
          this.load();
          this.open({ ...role, user_count: 0 });
        },
        error: (error: HttpErrorResponse) => {
          this.creating = false;
          this.errorMessage = error.error?.message || 'Could not create this role.';
        },
      });
  }

  remove(role: ShopRole): void {
    if (!confirm(`Delete the role “${role.name}”?`)) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.delete<unknown>(`/platform/tenants/${this.tenantId}/roles/${role.id}`).subscribe({
      next: () => {
        if (this.openRole?.id === role.id) this.openRole = null;
        this.successMessage = `Role “${role.name}” deleted.`;
        this.changed.emit();
        this.load();
      },
      error: (error: HttpErrorResponse) => (this.errorMessage = error.error?.message || 'Could not delete this role.'),
    });
  }

  // ── Permissions ────────────────────────────────────────────
  open(role: ShopRole): void {
    if (this.permDirty && this.openRole && this.openRole.id !== role.id && !confirm('Discard unsaved permission changes?')) return;
    this.openRole = role;
    this.permissions = [];
    this.permLoading = true;
    this.permDirty = false;
    this.api.get<{ permissions: RolePermission[] }>(`/platform/tenants/${this.tenantId}/roles/${role.id}/permissions`).subscribe({
      next: ({ permissions }) => {
        this.permissions = permissions;
        this.granted = new Set(permissions.filter((p) => p.granted).map((p) => p.id));
        this.permLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.permLoading = false;
        this.errorMessage = error.error?.message || 'Could not load the permissions.';
      },
    });
  }

  close(): void {
    if (this.permDirty && !confirm('Discard unsaved permission changes?')) return;
    this.openRole = null;
    this.permDirty = false;
  }

  toggle(permission: RolePermission | undefined): void {
    if (!permission || this.isOwnerOpen || !this.canEdit) return;
    if (this.granted.has(permission.id)) this.granted.delete(permission.id);
    else this.granted.add(permission.id);
    this.permDirty = true;
  }

  /** Whole row on or off. */
  toggleRow(row: PermissionRow): void {
    if (this.isOwnerOpen || !this.canEdit) return;
    const cells = Object.values(row.cells).filter((c): c is RolePermission => !!c);
    const allOn = cells.every((c) => this.granted.has(c.id));
    cells.forEach((c) => (allOn ? this.granted.delete(c.id) : this.granted.add(c.id)));
    this.permDirty = true;
  }

  rowAllOn(row: PermissionRow): boolean {
    const cells = Object.values(row.cells).filter((c): c is RolePermission => !!c);
    return cells.length > 0 && cells.every((c) => this.granted.has(c.id));
  }

  setAll(on: boolean): void {
    if (this.isOwnerOpen || !this.canEdit) return;
    this.granted = new Set(on ? this.permissions.map((p) => p.id) : []);
    this.permDirty = true;
  }

  savePermissions(): void {
    if (!this.openRole || this.permSaving) return;
    const role = this.openRole;
    this.permSaving = true;
    this.errorMessage = '';
    this.api
      .put<{ permissions: RolePermission[] }>(`/platform/tenants/${this.tenantId}/roles/${role.id}/permissions`, {
        permission_ids: [...this.granted],
      })
      .subscribe({
        next: ({ permissions }) => {
          this.permSaving = false;
          this.permDirty = false;
          this.permissions = permissions;
          this.granted = new Set(permissions.filter((p) => p.granted).map((p) => p.id));
          this.successMessage = `Permissions for “${role.name}” saved. Users with this role get them on their next request.`;
        },
        error: (error: HttpErrorResponse) => {
          this.permSaving = false;
          this.errorMessage = error.error?.message || 'Could not save the permissions.';
        },
      });
  }
}
