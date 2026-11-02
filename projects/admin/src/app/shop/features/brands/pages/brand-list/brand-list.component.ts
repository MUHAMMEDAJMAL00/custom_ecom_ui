import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Brand } from '../../models/brand.model';
import { BrandsService } from '../../services/brands.service';

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
  selector: 'app-brand-list',
  standalone: false,
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.css',
})
export class BrandListComponent implements OnInit {
  brands: Brand[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;
  uploading = false;
  viewingBrand: Brand | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    public brandsService: BrandsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: ['', Validators.required],
      logo_url: [''],
      sort_order: [0],
      is_active: [1],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.brandsService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.brands = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load brands.';
          this.loading = false;
        },
      });
  }

  onSearchInput(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.load(1), 250);
  }

  onLimitChange(value: string): void {
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  onNameInput(value: string): void {
    if (this.editId !== null) return;
    this.form.patchValue({ slug: slugify(value) }, { emitEvent: false });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.notify.warning('Logo must be 2 MB or smaller');
      input.value = '';
      return;
    }
    this.uploading = true;
    this.brandsService.uploadLogo(file).subscribe({
      next: (url) => {
        this.uploading = false;
        this.form.patchValue({ logo_url: url });
      },
      error: (err) => {
        this.uploading = false;
        this.notify.error(err.error?.message || 'Logo upload failed');
      },
    });
    input.value = '';
  }

  clearLogo(): void {
    this.form.patchValue({ logo_url: '' });
  }

  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', slug: '', logo_url: '', sort_order: 0, is_active: 1, description: '' });
    this.drawerMode = 'form';
  }

  openEdit(brand: Brand): void {
    this.editId = brand.id;
    this.form.reset({
      name: brand.name,
      slug: brand.slug,
      logo_url: brand.logo_url || '',
      sort_order: brand.sort_order ?? 0,
      is_active: brand.is_active,
      description: brand.description || '',
    });
    this.drawerMode = 'form';
  }

  openView(brand: Brand): void {
    this.viewingBrand = brand;
    this.drawerMode = 'view';
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Brand Details';
    return this.editId ? 'Edit Brand' : 'Add Brand';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    const slug = (raw.slug || '').trim().toLowerCase();
    if (!name) {
      this.notify.warning('Name is required');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      this.notify.warning('Slug: only lowercase letters, numbers and hyphens');
      return;
    }

    const payload: Partial<Brand> = {
      name,
      slug,
      logo_url: raw.logo_url || null,
      description: raw.description?.trim() || null,
      sort_order: parseInt(raw.sort_order, 10) || 0,
      is_active: parseInt(raw.is_active, 10),
    };

    this.saving = true;
    const request$ = this.editId !== null ? this.brandsService.update(this.editId, payload) : this.brandsService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId !== null ? 'Brand updated' : 'Brand created');
        this.closeDrawer();
        this.load(this.editId !== null ? this.page : 1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  async confirmDelete(brand: Brand): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Brand',
      message: `Are you sure you want to delete "${brand.name}"?`,
      note: brand.product_count
        ? `${brand.product_count} product(s) use this brand — reassign them first, or set the brand to Inactive instead.`
        : 'This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.brandsService.remove(brand.id).subscribe({
      next: () => {
        this.notify.success(`"${brand.name}" deleted`);
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingBrand = null;
    this.editId = null;
  }
}
