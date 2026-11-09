import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, inject } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface ShopUser {
  id: number;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role_id: number;
  is_active: number;
  must_change_password: number;
  last_login: string | null;
  role: { id: number; name: string } | null;
  is_owner: boolean;
}

interface ShopRole {
  id: number;
  name: string;
}

/** Shop users (owner, admins, staff) on the Super Admin shop edit screen. */
@Component({
  selector: 'app-tenant-users',
  standalone: false,
  templateUrl: './tenant-users.component.html',
  styleUrls: ['./tenant-users.component.scss'],
})
export class TenantUsersComponent implements OnInit {
  @Input({ required: true }) tenantId!: number;

  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-z0-9._-]+$/)]],
    email: ['', [Validators.email]],
    phone: [''],
    password: [''],
    role_id: [0],
    is_active: [true],
    must_change_password: [true],
  });

  users: ShopUser[] = [];
  roles: ShopRole[] = [];
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  /** null = form closed, 'new' = adding, a user = editing that user */
  editing: ShopUser | 'new' | null = null;
  showPassword = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
  ) {}

  get canEdit(): boolean {
    return this.auth.hasPermission('tenants', 'update');
  }

  get isNew(): boolean {
    return this.editing === 'new';
  }

  get editingOwner(): boolean {
    return this.editing !== null && this.editing !== 'new' && this.editing.is_owner;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.get<{ users: ShopUser[]; roles: ShopRole[] }>(`/platform/tenants/${this.tenantId}/users`).subscribe({
      next: ({ users, roles }) => {
        this.users = users;
        this.roles = roles;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Could not load this shop’s users.';
      },
    });
  }

  roleLabel(name: string | undefined): string {
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : '—';
  }

  startAdd(): void {
    const admin = this.roles.find((role) => role.name === 'admin') || this.roles[0];
    this.form.reset({ name: '', username: '', email: '', phone: '', password: '', role_id: admin?.id || 0, is_active: true, must_change_password: true });
    this.setPasswordRequired(true);
    this.form.controls.username.enable();
    this.editing = 'new';
    this.showPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  startEdit(user: ShopUser): void {
    this.form.reset({
      name: user.name,
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role_id: user.role_id,
      is_active: !!user.is_active,
      must_change_password: true,
    });
    this.setPasswordRequired(false);
    this.editing = user;
    this.showPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancel(): void {
    this.editing = null;
    this.errorMessage = '';
  }

  save(): void {
    if (this.form.invalid || this.saving || !this.editing) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const editing = this.editing;
    this.saving = true;
    this.errorMessage = '';

    const request =
      editing === 'new'
        ? this.api.post<ShopUser>(`/platform/tenants/${this.tenantId}/users`, {
            name: value.name.trim(),
            username: value.username.trim(),
            email: value.email.trim() || null,
            phone: value.phone.trim() || null,
            password: value.password,
            role_id: Number(value.role_id),
            must_change_password: value.must_change_password,
          })
        : this.api.patch<ShopUser>(`/platform/tenants/${this.tenantId}/users/${editing.id}`, {
            name: value.name.trim(),
            username: value.username.trim(),
            email: value.email.trim() || null,
            phone: value.phone.trim() || null,
            ...(value.password ? { password: value.password } : {}),
            // The owner keeps its role and stays active (the API refuses those changes)
            ...(editing.is_owner ? {} : { role_id: Number(value.role_id), is_active: value.is_active ? 1 : 0 }),
          });

    request.subscribe({
      next: (user) => {
        this.saving = false;
        this.editing = null;
        this.successMessage =
          editing === 'new'
            ? `${user.name} can now sign in as ${this.roleLabel(user.role?.name)} with username “${user.username}”.`
            : value.password
              ? `${user.name} updated. The new password works now; old sessions were signed out.`
              : `${user.name} updated.`;
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'Could not save this user.';
      },
    });
  }

  private setPasswordRequired(required: boolean): void {
    const control = this.form.controls.password;
    control.setValidators(required ? [Validators.required, Validators.minLength(8)] : [Validators.minLength(8)]);
    control.updateValueAndValidity();
  }
}
