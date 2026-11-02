import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AppUser, Role, StoreOption } from '../../models/user.model';
import { UsersService } from '../../services/users.service';

type DrawerMode = 'form' | 'view' | null;

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  users: AppUser[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '';
  roleFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  roles: Role[] = [];
  stores: StoreOption[] = [];

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;
  viewingUser: AppUser | null = null;
  showPassword = false;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      email: [''],
      phone: [''],
      role_id: ['', Validators.required],
      store_id: [''],
      is_active: [1],
      password: [''],
    });
  }

  ngOnInit(): void {
    forkJoin({ roles: this.usersService.getRoles(), stores: this.usersService.getStores() }).subscribe({
      next: (res) => {
        this.roles = res.roles;
        this.stores = res.stores;
      },
      error: () => undefined,
    });
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.usersService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined, role_id: this.roleFilter || undefined })
      .subscribe({
        next: (res) => {
          this.users = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load users.';
          this.loading = false;
        },
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  onFilterChange(): void {
    this.load(1);
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.showPassword = false;
    this.form.reset({ name: '', username: '', email: '', phone: '', role_id: '', store_id: '', is_active: 1, password: '' });
    this.drawerMode = 'form';
  }

  openEdit(user: AppUser): void {
    this.usersService.getById(user.id).subscribe({
      next: (u) => {
        this.editId = u.id;
        this.showPassword = false;
        this.form.reset({
          name: u.name,
          username: u.username,
          email: u.email || '',
          phone: u.phone || '',
          role_id: u.role_id,
          store_id: u.store_id ?? '',
          is_active: u.is_active,
          password: '',
        });
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load user'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'User Details';
    return this.editId ? 'Edit User' : 'Add User';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    const username = (raw.username || '').trim();
    const password = raw.password || '';

    if (!name) {
      this.notify.warning('Full name is required');
      return;
    }
    if (!this.editId && !username) {
      this.notify.warning('Username is required');
      return;
    }
    if (!raw.role_id) {
      this.notify.warning('Role is required');
      return;
    }
    if (!this.editId && password.length < 6) {
      this.notify.warning('Password must be at least 6 characters');
      return;
    }
    if (this.editId && password && password.length < 6) {
      this.notify.warning('New password must be at least 6 characters');
      return;
    }

    this.saving = true;

    if (this.editId) {
      const updatePayload: Partial<AppUser> = {
        name,
        username: username || undefined,
        email: raw.email?.trim() || null,
        phone: raw.phone?.trim() || null,
        role_id: parseInt(raw.role_id, 10),
        store_id: raw.store_id ? parseInt(raw.store_id, 10) : null,
        is_active: parseInt(raw.is_active, 10),
      } as Partial<AppUser>;

      this.usersService.update(this.editId, updatePayload).subscribe({
        next: () => {
          if (password) {
            this.usersService.resetPassword(this.editId!, password).subscribe({
              next: () => this.finishSave('User updated'),
              error: (err) => this.failSave(err),
            });
          } else {
            this.finishSave('User updated');
          }
        },
        error: (err) => this.failSave(err),
      });
    } else {
      const createPayload = {
        name,
        username,
        email: raw.email?.trim() || null,
        phone: raw.phone?.trim() || null,
        password,
        role_id: parseInt(raw.role_id, 10),
        store_id: raw.store_id ? parseInt(raw.store_id, 10) : null,
      };
      this.usersService.create(createPayload).subscribe({
        next: () => this.finishSave('User created'),
        error: (err) => this.failSave(err),
      });
    }
  }

  private finishSave(message: string): void {
    this.saving = false;
    this.notify.success(message);
    this.closeDrawer();
    this.load(1);
  }

  private failSave(err: any): void {
    this.saving = false;
    this.notify.error(err.error?.message || 'Save failed');
  }

  // ── View ───────────────────────────────────────────────────
  openView(user: AppUser): void {
    this.viewingUser = user;
    this.drawerMode = 'view';
  }

  lastLoginDisplay(user: AppUser): string {
    return user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(user: AppUser): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete User',
      message: `Delete user "${user.name}"?`,
      note: 'The user will be deactivated and removed from the list.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.usersService.remove(user.id).subscribe({
      next: () => {
        this.notify.success('User deleted');
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingUser = null;
    this.editId = null;
  }
}
