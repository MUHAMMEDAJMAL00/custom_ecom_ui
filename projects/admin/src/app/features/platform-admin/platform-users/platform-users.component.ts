import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface PlatformUserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id: number | null;
  role_name: string;
  role_label: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

interface PlatformRoleOption {
  id: number;
  name: string;
  label: string;
  is_system: boolean;
}

interface CreateUserDraft {
  name: string;
  email: string;
  password: string;
  role_id: number | null;
}

@Component({
  selector: 'app-platform-users',
  standalone: false,
  templateUrl: './platform-users.component.html',
  styleUrls: ['./platform-users.component.scss'],
})
export class PlatformUsersComponent implements OnInit {
  users: PlatformUserRow[] = [];
  roles: PlatformRoleOption[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';

  showCreate = false;
  draft: CreateUserDraft = { name: '', email: '', password: '', role_id: null };

  resetTarget: PlatformUserRow | null = null;
  resetPassword = '';
  resetting = false;
  resetError = '';

  private readonly auth = inject(AuthService);
  readonly currentUser$ = this.auth.currentUser$;

  constructor(private api: ApiService) {}

  get activeCount(): number {
    return this.users.filter((user) => user.status === 'active').length;
  }

  get ownerCount(): number {
    return this.users.filter((user) => user.role_name === 'platform_owner' && user.status === 'active').length;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.api.get<PlatformUserRow[]>('/platform/users'),
      roles: this.api.get<PlatformRoleOption[]>('/platform/roles'),
    }).subscribe({
      next: ({ users, roles }) => {
        this.users = users;
        this.roles = roles;
        this.draft.role_id =
          this.roles.find((role) => role.name === 'platform_support')?.id ?? this.roles[0]?.id ?? null;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load platform users.';
      },
    });
  }

  openCreate(): void {
    this.showCreate = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.draft = {
      name: '',
      email: '',
      password: '',
      role_id: this.roles.find((role) => role.name === 'platform_support')?.id ?? this.roles[0]?.id ?? null,
    };
  }

  cancelCreate(): void {
    this.showCreate = false;
  }

  create(): void {
    if (!this.draft.name.trim() || !this.draft.email.trim() || this.draft.password.length < 8) {
      this.errorMessage = 'Enter a name, a valid email, and a password of at least 8 characters.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.api.post<PlatformUserRow>('/platform/users', this.draft).subscribe({
      next: (user) => {
        this.users = [...this.users, user];
        this.saving = false;
        this.showCreate = false;
        this.successMessage = `${user.name} was added as ${user.role_label}.`;
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Could not create this platform user.';
      },
    });
  }

  changeRole(user: PlatformUserRow, select: HTMLSelectElement): void {
    const id = Number(select.value);
    if (!id || id === user.role_id) return;
    this.update(user, { role_id: id }, () => {
      // Refused (e.g. last Super Admin): put the dropdown back on the saved role
      select.value = String(user.role_id);
    });
  }

  toggleStatus(user: PlatformUserRow): void {
    this.update(user, { status: user.status === 'active' ? 'disabled' : 'active' });
  }

  openReset(user: PlatformUserRow): void {
    this.resetTarget = user;
    this.resetPassword = '';
    this.resetError = '';
  }

  cancelReset(): void {
    if (this.resetting) return;
    this.resetTarget = null;
  }

  confirmReset(): void {
    if (!this.resetTarget) return;
    if (this.resetPassword.length < 8) {
      this.resetError = 'Use at least 8 characters.';
      return;
    }

    this.resetting = true;
    this.resetError = '';
    this.api.patch<PlatformUserRow>(`/platform/users/${this.resetTarget.id}`, {
      password: this.resetPassword,
    }).subscribe({
      next: (updated) => {
        this.users = this.users.map((row) => (row.id === updated.id ? updated : row));
        this.resetting = false;
        this.resetTarget = null;
        this.successMessage = `Password reset for ${updated.name}. Existing sessions were revoked.`;
      },
      error: (error: HttpErrorResponse) => {
        this.resetting = false;
        this.resetError = error.error?.message || 'Could not reset this password.';
      },
    });
  }

  deleteUser(user: PlatformUserRow): void {
    if (!confirm(`Delete platform user "${user.name}"? This cannot be undone.`)) return;

    this.api.delete(`/platform/users/${user.id}`).subscribe({
      next: () => {
        this.users = this.users.filter((row) => row.id !== user.id);
        this.successMessage = `${user.name} deleted.`;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Could not delete this platform user.';
      },
    });
  }

  private update(user: PlatformUserRow, changes: Record<string, string | number>, onError?: () => void): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.api.patch<PlatformUserRow>(`/platform/users/${user.id}`, changes).subscribe({
      next: (updated) => {
        this.users = this.users.map((row) => (row.id === updated.id ? updated : row));
        this.successMessage = `${updated.name} is now ${updated.role_label}.`;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Could not update this platform user.';
        onError?.();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }
}
