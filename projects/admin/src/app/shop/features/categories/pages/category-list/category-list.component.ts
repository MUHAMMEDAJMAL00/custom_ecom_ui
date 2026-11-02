import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Category } from '../../models/category.model';
import { CategoriesService } from '../../services/categories.service';

type DrawerMode = 'form' | 'view' | null;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css',
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  allCategories: Category[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '1';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;
  viewingCategory: Category | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      sort_order: [0],
      is_active: [1],
      parent_id: [''],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadAllCategories();
    this.load(1);
  }

  loadAllCategories(): void {
    this.categoriesService.getAllFlat().subscribe({
      next: (rows) => (this.allCategories = rows),
      error: () => (this.allCategories = []),
    });
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.categoriesService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.categories = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load categories.';
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

  parentOptions(excludeId: number | null): Category[] {
    return this.allCategories.filter((c) => c.id !== excludeId);
  }

  onNameInput(value: string): void {
    if (this.editId !== null) return;
    this.form.patchValue({ slug: slugify(value) }, { emitEvent: false });
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', slug: '', sort_order: 0, is_active: 1, parent_id: '', description: '' });
    this.drawerMode = 'form';
  }

  openEdit(category: Category): void {
    this.categoriesService.getById(category.id).subscribe({
      next: (c) => {
        this.editId = c.id;
        this.form.reset({
          name: c.name,
          slug: c.slug,
          sort_order: c.sort_order ?? 0,
          is_active: c.is_active,
          parent_id: c.parent_id ?? '',
          description: c.description || '',
        });
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load category'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Category Details';
    return this.editId ? 'Edit Category' : 'Add Category';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    const slug = (raw.slug || '').trim().toLowerCase();

    if (!name) {
      this.notify.warning('Name is required');
      return;
    }
    if (!slug) {
      this.notify.warning('Slug is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      this.notify.warning('Slug: only lowercase letters, numbers and hyphens');
      return;
    }

    const payload: Partial<Category> = {
      name,
      slug,
      description: raw.description?.trim() || null,
      sort_order: parseInt(raw.sort_order, 10) || 0,
      is_active: parseInt(raw.is_active, 10),
      parent_id: raw.parent_id ? parseInt(raw.parent_id, 10) : null,
    };

    this.saving = true;
    const request$ = this.editId !== null ? this.categoriesService.update(this.editId, payload) : this.categoriesService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId !== null ? 'Category updated' : 'Category created');
        this.closeDrawer();
        this.load(1);
        this.loadAllCategories();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.message || '';
        this.notify.error(msg.includes('Slug') ? 'Slug already in use — try a different one' : msg || 'Save failed');
      },
    });
  }

  // ── View ───────────────────────────────────────────────────
  openView(category: Category): void {
    this.viewingCategory = category;
    this.drawerMode = 'view';
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(category: Category): Promise<void> {
    const childCount = category.children?.length || 0;
    const note = childCount > 0
      ? `Its ${childCount} sub-categor${childCount > 1 ? 'ies' : 'y'} will be moved to top-level. This cannot be undone.`
      : 'This cannot be undone.';

    const confirmed = await this.confirmService.show({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"?`,
      note,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.categoriesService.remove(category.id).subscribe({
      next: () => {
        this.notify.success(`"${category.name}" deleted`);
        if (!this.statusFilter) this.statusFilter = '1';
        this.load(1);
        this.loadAllCategories();
      },
      error: (err) => {
        const msg = err.error?.message || '';
        this.notify.error(msg.includes('active products') ? 'Cannot delete — move or deactivate its products first' : msg || 'Delete failed');
      },
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingCategory = null;
    this.editId = null;
  }
}
