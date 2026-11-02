import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Category } from '../../../categories/models/category.model';
import { Banner } from '../../models/banner.model';
import { BannersService } from '../../services/banners.service';

type DrawerMode = 'form' | 'view' | null;
type ImageField = 'image_url' | 'products_image_url';

@Component({
  selector: 'app-banner-list',
  standalone: false,
  templateUrl: './banner-list.component.html',
  styleUrl: './banner-list.component.css',
})
export class BannerListComponent implements OnInit {
  banners: Banner[] = [];
  categories: Category[] = [];
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
  uploadingField: ImageField | null = null;
  viewingBanner: Banner | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    public bannersService: BannersService,
    private categoriesService: CategoriesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      eyebrow: [''],
      title: ['', Validators.required],
      title_line2: [''],
      text: [''],
      cta_label: [''],
      script: [''],
      image_url: [''],
      products_image_url: [''],
      category_id: [null as number | null],
      link_url: [''],
      sort_order: [0],
      is_active: [1],
    });
  }

  ngOnInit(): void {
    this.load(1);
    this.categoriesService.getAllFlat().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.categories = []),
    });
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.bannersService
      .getAll({
        page: this.page,
        limit: this.limit,
        search: this.search || undefined,
        is_active: this.statusFilter || undefined,
        placement: 'home_hero',
      })
      .subscribe({
        next: (res) => {
          this.banners = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load banners.';
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

  onImageSelected(event: Event, field: ImageField): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.notify.warning('Image must be 5 MB or smaller');
      input.value = '';
      return;
    }
    this.uploadingField = field;
    this.bannersService.uploadImage(file).subscribe({
      next: (url) => {
        this.uploadingField = null;
        this.form.patchValue({ [field]: url });
      },
      error: (err) => {
        this.uploadingField = null;
        this.notify.error(err.error?.message || 'Image upload failed');
      },
    });
    input.value = '';
  }

  clearImage(field: ImageField): void {
    this.form.patchValue({ [field]: '' });
  }

  onCategoryChange(): void {
    if (this.form.value.category_id) this.form.patchValue({ link_url: '' }, { emitEvent: false });
  }

  onLinkUrlInput(value: string): void {
    if (value) this.form.patchValue({ category_id: null }, { emitEvent: false });
  }

  openAdd(): void {
    this.editId = null;
    this.form.reset({
      eyebrow: '',
      title: '',
      title_line2: '',
      text: '',
      cta_label: '',
      script: '',
      image_url: '',
      products_image_url: '',
      category_id: null,
      link_url: '',
      sort_order: this.banners.length,
      is_active: 1,
    });
    this.drawerMode = 'form';
  }

  openEdit(banner: Banner): void {
    this.editId = banner.id;
    this.form.reset({
      eyebrow: banner.eyebrow || '',
      title: banner.title,
      title_line2: banner.title_line2 || '',
      text: banner.text || '',
      cta_label: banner.cta_label || '',
      script: banner.script || '',
      image_url: banner.image_url || '',
      products_image_url: banner.products_image_url || '',
      category_id: banner.category_id ?? null,
      link_url: banner.link_url || '',
      sort_order: banner.sort_order ?? 0,
      is_active: banner.is_active,
    });
    this.drawerMode = 'form';
  }

  openView(banner: Banner): void {
    this.viewingBanner = banner;
    this.drawerMode = 'view';
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Banner Details';
    return this.editId ? 'Edit Banner' : 'Add Banner';
  }

  linkLabel(banner: Banner): string {
    return banner.category?.name || banner.link_url || 'No link';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const title = (raw.title || '').trim();
    if (!title) {
      this.notify.warning('Title is required');
      return;
    }

    const payload: Partial<Banner> = {
      placement: 'home_hero',
      eyebrow: raw.eyebrow?.trim() || null,
      title,
      title_line2: raw.title_line2?.trim() || null,
      text: raw.text?.trim() || null,
      cta_label: raw.cta_label?.trim() || null,
      script: raw.script?.trim() || null,
      image_url: raw.image_url || null,
      products_image_url: raw.products_image_url || null,
      category_id: raw.category_id ? Number(raw.category_id) : null,
      link_url: raw.category_id ? null : raw.link_url?.trim() || null,
      sort_order: parseInt(raw.sort_order, 10) || 0,
      is_active: parseInt(raw.is_active, 10),
    };

    this.saving = true;
    const request$ = this.editId !== null ? this.bannersService.update(this.editId, payload) : this.bannersService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId !== null ? 'Banner updated' : 'Banner created');
        this.closeDrawer();
        this.load(this.editId !== null ? this.page : 1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  async confirmDelete(banner: Banner): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Banner',
      message: `Are you sure you want to delete "${banner.title}"?`,
      note: 'The slide disappears from the storefront home page. Set it to Inactive instead to hide it temporarily.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.bannersService.remove(banner.id).subscribe({
      next: () => {
        this.notify.success(`"${banner.title}" deleted`);
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingBanner = null;
    this.editId = null;
  }
}
