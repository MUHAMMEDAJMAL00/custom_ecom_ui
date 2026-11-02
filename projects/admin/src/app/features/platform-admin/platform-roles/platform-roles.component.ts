import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface PlatformPermission {
  id: number;
  module: string;
  action: string;
  description: string | null;
}

interface PlatformRole {
  id: number;
  name: string;
  label: string;
  description: string | null;
  is_system: boolean;
  users: number;
  permission_ids: number[];
}

interface PermissionGroup {
  module: string;
  permissions: PlatformPermission[];
}

interface RoleDraft {
  name: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-platform-roles',
  standalone: false,
  templateUrl: './platform-roles.component.html',
  styleUrls: ['./platform-roles.component.scss'],
})
export class PlatformRolesComponent implements OnInit {
  roles: PlatformRole[] = [];
  permissions: PlatformPermission[] = [];
  selectedRoleId: number | null = null;
  selected = new Set<number>();

  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  showRoleForm = false;
  editingRole: PlatformRole | null = null;
  draft: RoleDraft = { name: '', label: '', description: '' };
  roleSaving = false;
  roleError = '';

  constructor(private api: ApiService) {}

  get selectedRole(): PlatformRole | null {
    return this.roles.find((role) => role.id === this.selectedRoleId) ?? null;
  }

  get isOwnerRole(): boolean {
    return this.selectedRole?.name === 'platform_owner';
  }

  get dirty(): boolean {
    const role = this.selectedRole;
    if (!role) return false;
    if (role.permission_ids.length !== this.selected.size) return true;
    return role.permission_ids.some((id) => !this.selected.has(id));
  }

  get groups(): PermissionGroup[] {
    const map = new Map<string, PlatformPermission[]>();
    for (const permission of this.permissions) {
      const rows = map.get(permission.module) || [];
      rows.push(permission);
      map.set(permission.module, rows);
    }
    return Array.from(map, ([module, permissions]) => ({ module, permissions }));
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      roles: this.api.get<PlatformRole[]>('/platform/roles'),
      permissions: this.api.get<PlatformPermission[]>('/platform/permissions'),
    }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles = roles;
        this.permissions = permissions;
        this.loading = false;
        const keep = roles.find((role) => role.id === this.selectedRoleId);
        this.selectRole(keep || roles[0] || null);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load platform roles.';
      },
    });
  }

  selectRole(role: PlatformRole | null): void {
    this.selectedRoleId = role?.id ?? null;
    this.selected = new Set(role?.permission_ids ?? []);
    this.successMessage = '';
  }

  isChecked(permission: PlatformPermission): boolean {
    return this.isOwnerRole || this.selected.has(permission.id);
  }

  toggle(permission: PlatformPermission): void {
    if (this.isOwnerRole) return;
    if (this.selected.has(permission.id)) this.selected.delete(permission.id);
    else this.selected.add(permission.id);
  }

  moduleLabel(module: string): string {
    return module.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  savePermissions(): void {
    const role = this.selectedRole;
    if (!role || this.isOwnerRole) return;

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.put<{ role_id: number }>(`/platform/roles/${role.id}/permissions`, {
      permission_ids: Array.from(this.selected),
    }).subscribe({
      next: () => {
        role.permission_ids = Array.from(this.selected);
        this.saving = false;
        this.successMessage = 'Role permissions saved.';
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Could not save role permissions.';
      },
    });
  }

  openCreate(): void {
    this.editingRole = null;
    this.draft = { name: '', label: '', description: '' };
    this.roleError = '';
    this.showRoleForm = true;
  }

  openEdit(role: PlatformRole): void {
    this.editingRole = role;
    this.draft = {
      name: role.name,
      label: role.label,
      description: role.description || '',
    };
    this.roleError = '';
    this.showRoleForm = true;
  }

  closeRoleForm(): void {
    if (this.roleSaving) return;
    this.showRoleForm = false;
  }

  saveRole(): void {
    if (!this.draft.name.trim() || !this.draft.label.trim()) {
      this.roleError = 'Name and label are required.';
      return;
    }

    this.roleSaving = true;
    this.roleError = '';

    const request = this.editingRole
      ? this.api.put<PlatformRole>(`/platform/roles/${this.editingRole.id}`, this.draft)
      : this.api.post<PlatformRole>('/platform/roles', this.draft);

    request.subscribe({
      next: () => {
        this.roleSaving = false;
        this.showRoleForm = false;
        this.successMessage = this.editingRole ? 'Role updated.' : 'Role created.';
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.roleSaving = false;
        this.roleError = error.error?.message || 'Could not save this role.';
      },
    });
  }

  deleteRole(role: PlatformRole): void {
    if (role.is_system) return;
    if (!confirm(`Delete role "${role.label}"? Users must be moved first.`)) return;

    this.api.delete(`/platform/roles/${role.id}`).subscribe({
      next: () => {
        this.successMessage = 'Role deleted.';
        if (this.selectedRoleId === role.id) this.selectedRoleId = null;
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Could not delete this role.';
      },
    });
  }
}
