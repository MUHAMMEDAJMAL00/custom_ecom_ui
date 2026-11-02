import { storefrontLink } from '../../../../core/utils/shop-url';
import { Component, HostListener, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CategoriesService } from '../../../categories/services/categories.service';
import { Category } from '../../../categories/models/category.model';
import { BannersService } from '../../services/banners.service';
import { HomeSectionsService } from '../../services/home-sections.service';
import {
  HomeSection,
  HomeSectionItem,
  ItemField,
  SECTION_CONFIG,
  SectionConfig,
  SectionField,
} from '../../models/home-section.model';

interface SectionForm {
  eyebrow: string;
  title: string;
  subtitle: string;
  highlight: string;
  cta_label: string;
  image_url: string;
  link_url: string;
  category_id: number | null;
  is_active: number;
}

interface ItemForm {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: string;
  image_url: string;
  style: string;
  tint: string;
  link_url: string;
  category_id: number | null;
  product_id: number | null;
  sort_order: number;
  is_active: number;
}

const DEFAULT_LABELS: Record<string, string> = {
  eyebrow: 'Small line',
  title: 'Title',
  subtitle: 'Subtitle',
  highlight: 'Highlight',
  cta_label: 'Button label',
  icon: 'Icon',
  tint: 'Tint colour',
  style: 'Card style',
  product_id: 'Product ID',
};

/** Website → Home Sections: copy and cards for every content block of the storefront home page. */
@Component({
  selector: 'app-home-section-list',
  standalone: false,
  templateUrl: './home-section-list.component.html',
  styleUrls: ['../banner-list/banner-list.component.css', './home-section-list.component.css'],
})
export class HomeSectionListComponent implements OnInit {
  sections: HomeSection[] = [];
  categories: Category[] = [];
  loading = true;
  errorMessage = '';
  activeKey = '';

  sectionForm: SectionForm = this.emptySectionForm();
  /** Last saved copy of sectionForm, to show "unsaved changes" */
  private savedForm = '';
  savingSection = false;
  reordering = false;

  itemDrawerOpen = false;
  editItemId: number | null = null;
  itemForm: ItemForm = this.emptyItemForm();
  savingItem = false;
  uploading: 'section' | 'item' | null = null;

  constructor(
    private service: HomeSectionsService,
    public images: BannersService,
    private categoriesService: CategoriesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.categoriesService.getAllFlat().subscribe({
      next: (categories) => (this.categories = categories),
      error: () => (this.categories = []),
    });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.service.getAll().subscribe({
      next: (sections) => {
        this.sections = sections;
        this.loading = false;
        const key = this.activeKey && sections.some((s) => s.section_key === this.activeKey) ? this.activeKey : sections[0]?.section_key;
        // Reloading after a card change keeps unsaved edits to the section copy
        if (!(key === this.activeKey && this.sectionDirty)) this.select(key);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to load home sections.';
      },
    });
  }

  get active(): HomeSection | undefined {
    return this.sections.find((s) => s.section_key === this.activeKey);
  }

  get config(): SectionConfig {
    return SECTION_CONFIG[this.activeKey] ?? { icon: 'bi-grid', hint: '', fields: ['title'] };
  }

  iconOf(key: string): string {
    return SECTION_CONFIG[key]?.icon ?? 'bi-grid';
  }

  /** Section copy edited but not saved yet. */
  get sectionDirty(): boolean {
    return !!this.savedForm && JSON.stringify(this.sectionForm) !== this.savedForm;
  }

  /** Cards in display order. */
  get orderedItems(): HomeSectionItem[] {
    return [...(this.active?.items ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }

  get shownCount(): number {
    return (this.active?.items ?? []).filter((i) => i.is_active).length;
  }

  /** Where this section sits on the website home page. */
  get siteUrl(): string {
    const anchors: Record<string, string> = { brands: '#brands', value: '#value', stories: '#community', trending: '#community' };
    return storefrontLink(environment.storefrontUrl, anchors[this.activeKey] ?? '', environment.production, environment.rootDomain);
  }

  @HostListener('window:beforeunload', ['$event'])
  warnUnsaved(event: BeforeUnloadEvent): void {
    if (this.sectionDirty) event.preventDefault();
  }

  select(key: string | undefined): void {
    if (!key) return;
    if (this.sectionDirty && key !== this.activeKey && !confirm('Discard unsaved changes to this section?')) return;
    this.activeKey = key;
    const s = this.active!;
    this.sectionForm = {
      eyebrow: s.eyebrow || '',
      title: s.title || '',
      subtitle: s.subtitle || '',
      highlight: s.highlight || '',
      cta_label: s.cta_label || '',
      image_url: s.image_url || '',
      link_url: s.link_url || '',
      category_id: s.category_id ?? null,
      is_active: s.is_active,
    };
    this.savedForm = JSON.stringify(this.sectionForm);
  }

  resetSection(): void {
    this.sectionForm = JSON.parse(this.savedForm);
  }

  has(field: SectionField): boolean {
    return this.config.fields.includes(field);
  }

  hasItem(field: ItemField): boolean {
    return !!this.config.items?.fields.includes(field);
  }

  label(field: string): string {
    return (this.config.fieldLabels as any)?.[field] || DEFAULT_LABELS[field] || 'Title';
  }

  itemLabel(field: ItemField): string {
    return this.config.items?.labels?.[field] || DEFAULT_LABELS[field] || 'Title';
  }

  placeholder(field: ItemField): string {
    return this.config.items?.placeholders?.[field] || '';
  }

  linkLabel(row: { link_url: string | null; category_id: number | null; product_id?: number | null }): string {
    if (row.product_id) return `Product #${row.product_id}`;
    if (row.category_id) return this.categories.find((c) => c.id === row.category_id)?.name || `Category #${row.category_id}`;
    return row.link_url || '—';
  }

  // ── Section copy ──────────────────────────────────────────
  saveSection(): void {
    const f = this.sectionForm;
    const clean = (v: string) => v.trim() || null;
    const payload: Partial<HomeSection> = { is_active: Number(f.is_active) };
    if (this.has('eyebrow')) payload.eyebrow = clean(f.eyebrow);
    if (this.has('title')) payload.title = clean(f.title);
    if (this.has('subtitle')) payload.subtitle = clean(f.subtitle);
    if (this.has('highlight')) payload.highlight = clean(f.highlight);
    if (this.has('cta_label')) payload.cta_label = clean(f.cta_label);
    if (this.has('image_url')) payload.image_url = f.image_url || null;
    if (this.has('link')) {
      payload.category_id = f.category_id ? Number(f.category_id) : null;
      payload.link_url = f.category_id ? null : clean(f.link_url);
    }
    this.savingSection = true;
    this.service.updateSection(this.activeKey, payload).subscribe({
      next: () => {
        this.savingSection = false;
        this.savedForm = JSON.stringify(this.sectionForm);
        this.notify.success('Section saved — the website shows it on the next page load');
        this.load();
      },
      error: (err) => {
        this.savingSection = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  // ── Cards ─────────────────────────────────────────────────
  openAddItem(): void {
    this.editItemId = null;
    this.itemForm = { ...this.emptyItemForm(), sort_order: this.active?.items.length ?? 0 };
    this.itemDrawerOpen = true;
  }

  openEditItem(item: HomeSectionItem): void {
    this.editItemId = item.id;
    this.itemForm = {
      eyebrow: item.eyebrow || '',
      title: item.title,
      subtitle: item.subtitle || '',
      icon: item.icon || '',
      image_url: item.image_url || '',
      style: item.style || 'round',
      tint: item.tint || '',
      link_url: item.link_url || '',
      category_id: item.category_id ?? null,
      product_id: item.product_id ?? null,
      sort_order: item.sort_order,
      is_active: item.is_active,
    };
    this.itemDrawerOpen = true;
  }

  closeItemDrawer(): void {
    this.itemDrawerOpen = false;
  }

  saveItem(): void {
    const f = this.itemForm;
    // Image-only cards (trending/connect photos) still need a title for the list
    const title = f.title.trim() || (this.hasItem('image_url') && !this.hasItem('subtitle') ? `${this.config.items?.noun} ${f.sort_order + 1}` : '');
    if (!title) {
      this.notify.warning(`${this.itemLabel('title')} is required`);
      return;
    }
    if (this.hasItem('image_url') && !f.image_url && ['trending', 'connect'].includes(this.activeKey)) {
      this.notify.warning('Upload an image');
      return;
    }
    const clean = (v: string) => v.trim() || null;
    const payload: Partial<HomeSectionItem> = {
      title,
      sort_order: Number(f.sort_order) || 0,
      is_active: Number(f.is_active),
      eyebrow: this.hasItem('eyebrow') ? clean(f.eyebrow) : null,
      subtitle: this.hasItem('subtitle') ? clean(f.subtitle) : null,
      icon: this.hasItem('icon') ? clean(f.icon) : null,
      image_url: this.hasItem('image_url') ? f.image_url || null : null,
      style: this.hasItem('style') ? (f.style as HomeSectionItem['style']) || null : null,
      tint: this.hasItem('tint') ? clean(f.tint) : null,
      product_id: this.hasItem('product_id') && f.product_id ? Number(f.product_id) : null,
      category_id: this.hasItem('link') && f.category_id ? Number(f.category_id) : null,
      link_url: this.hasItem('link') && !f.category_id ? clean(f.link_url) : null,
    };
    this.savingItem = true;
    const request$ = this.editItemId !== null
      ? this.service.updateItem(this.editItemId, payload)
      : this.service.createItem(this.activeKey, payload);
    request$.subscribe({
      next: () => {
        this.savingItem = false;
        this.itemDrawerOpen = false;
        this.notify.success(this.editItemId !== null ? 'Card updated' : 'Card added');
        this.load();
      },
      error: (err) => {
        this.savingItem = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  /** Moves a card one place up/down and renumbers the section 0, 1, 2… */
  moveItem(item: HomeSectionItem, step: -1 | 1): void {
    const list = this.orderedItems;
    const from = list.findIndex((i) => i.id === item.id);
    const to = from + step;
    if (to < 0 || to >= list.length || this.reordering) return;
    [list[from], list[to]] = [list[to], list[from]];
    const changes = list
      .map((i, index) => ({ i, index }))
      .filter(({ i, index }) => i.sort_order !== index)
      .map(({ i, index }) => this.service.updateItem(i.id, { sort_order: index }));
    if (!changes.length) return;
    this.reordering = true;
    forkJoin(changes).subscribe({
      next: () => {
        this.reordering = false;
        this.load();
      },
      error: (err) => {
        this.reordering = false;
        this.notify.error(err.error?.message || 'Could not reorder');
        this.load();
      },
    });
  }

  toggleItem(item: HomeSectionItem): void {
    this.service.updateItem(item.id, { is_active: item.is_active ? 0 : 1 }).subscribe({
      next: () => this.load(),
      error: (err) => this.notify.error(err.error?.message || 'Update failed'),
    });
  }

  async confirmDeleteItem(item: HomeSectionItem): Promise<void> {
    const ok = await this.confirmService.show({
      title: 'Delete card',
      message: `Delete "${item.title}" from ${this.active?.name}?`,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    this.service.removeItem(item.id).subscribe({
      next: () => {
        this.notify.success('Card deleted');
        this.load();
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  // ── Images ────────────────────────────────────────────────
  onImageSelected(event: Event, target: 'section' | 'item'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.notify.warning('Image must be 5 MB or smaller');
      return;
    }
    this.uploading = target;
    this.service.uploadImage(file).subscribe({
      next: (url) => {
        this.uploading = null;
        if (target === 'section') this.sectionForm.image_url = url;
        else this.itemForm.image_url = url;
      },
      error: (err) => {
        this.uploading = null;
        this.notify.error(err.error?.message || 'Image upload failed');
      },
    });
  }

  private emptySectionForm(): SectionForm {
    return { eyebrow: '', title: '', subtitle: '', highlight: '', cta_label: '', image_url: '', link_url: '', category_id: null, is_active: 1 };
  }

  private emptyItemForm(): ItemForm {
    return {
      eyebrow: '', title: '', subtitle: '', icon: '', image_url: '', style: 'round', tint: '',
      link_url: '', category_id: null, product_id: null, sort_order: 0, is_active: 1,
    };
  }
}
