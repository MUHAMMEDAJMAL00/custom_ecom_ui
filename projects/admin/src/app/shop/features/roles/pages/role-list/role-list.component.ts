import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  user_count: number;
}

interface PermissionRow {
  id: number;
  module: string;
  action: string;
  description: string | null;
  granted: boolean;
}

interface PermissionGroup {
  module: string;
  rows: PermissionRow[];
}

const ACTIONS = ['read', 'create', 'update', 'delete'];

@Component({
  selector: 'app-role-list',
  standalone: false,
  templateUrl: './role-list.component.html',
})
export class RoleListComponent implements OnInit {
  roles: Role[] = [];
  loading = true;
  errorMessage = '';

  drawer: 'form' | 'permissions' | null = null;
  editing: Role | null = null;
  name = '';
  description = '';
  saving = false;

  groups: PermissionGroup[] = [];
  permissionsLoading = false;
  readonly actions = ACTIONS;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private notify: NotificationService,
    private confirm: ConfirmService,
  ) {}

  get canEdit(): boolean {
    return this.auth.hasPermission('roles', 'update');
  }

  get canCreate(): boolean {
    return this.auth.hasPermission('roles', 'create');
  }

  get canDelete(): boolean {
    return this.auth.hasPermission('roles', 'delete');
  }

  get drawerTitle(): string {
    if (this.drawer === 'permissions') return `Permissions — ${this.editing?.name ?? ''}`;
    return this.editing ? 'Edit Role' : 'Add Role';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.get<Role[]>('/roles').subscribe({
      next: (res) => {
        this.roles = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Could not load roles.';
      },
    });
  }

  label(text: string): string {
    return text.replace(/_/g, ' ');
  }

  openAdd(): void {
    this.editing = null;
    this.name = '';
    this.description = '';
    this.drawer = 'form';
  }

  openEdit(role: Role): void {
    this.editing = role;
    this.name = role.name;
    this.description = role.description || '';
    this.drawer = 'form';
  }

  openPermissions(role: Role): void {
    this.editing = role;
    this.drawer = 'permissions';
    this.permissionsLoading = true;
    this.groups = [];
    this.api.get<{ permissions: PermissionRow[] }>(`/roles/${role.id}/permissions`).subscribe({
      next: (res) => {
        const byModule = new Map<string, PermissionRow[]>();
        for (const row of res.data.permissions) {
          const list = byModule.get(row.module) ?? [];
          list.push(row);
          byModule.set(row.module, list);
        }
        this.groups = [...byModule.entries()].map(([module, rows]) => ({ module, rows }));
        this.permissionsLoading = false;
      },
      error: () => (this.permissionsLoading = false),
    });
  }

  rowFor(group: PermissionGroup, action: string): PermissionRow | undefined {
    return group.rows.find((r) => r.action === action);
  }

  toggleGroup(group: PermissionGroup, granted: boolean): void {
    group.rows.forEach((r) => (r.granted = granted));
  }

  allGranted(group: PermissionGroup): boolean {
    return group.rows.every((r) => r.granted);
  }

  closeDrawer(): void {
    this.drawer = null;
    this.editing = null;
  }

  save(): void {
    if (this.drawer === 'permissions') {
      this.savePermissions();
      return;
    }
    if (!this.name.trim()) {
      this.notify.warning('Role name is required');
      return;
    }
    const body = { name: this.name.trim(), description: this.description.trim() || null };
    const editing = this.editing;
    const request = editing ? this.api.put<Role>(`/roles/${editing.id}`, body) : this.api.post<Role>('/roles', body);
    this.saving = true;
    request.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(editing ? 'Role updated' : 'Role created');
        this.closeDrawer();
        this.load();
      },
      error: () => (this.saving = false),
    });
  }

  private savePermissions(): void {
    if (!this.editing) return;
    const ids = this.groups.flatMap((g) => g.rows.filter((r) => r.granted).map((r) => r.id));
    this.saving = true;
    this.api.put(`/roles/${this.editing.id}/permissions`, { permission_ids: ids }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Permissions saved');
        this.closeDrawer();
      },
      error: () => (this.saving = false),
    });
  }

  async remove(role: Role): Promise<void> {
    const ok = await this.confirm.show({
      title: 'Delete role?',
      message: `"${role.name}" will be removed.`,
      note: 'Roles that still have users cannot be deleted.',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    this.api.delete(`/roles/${role.id}`).subscribe({
      next: () => {
        this.notify.success('Role deleted');
        this.load();
      },
    });
  }
}
