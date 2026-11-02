import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TaxGroup } from '../../models/tax-group.model';
import { TaxGroupsService } from '../../services/tax-groups.service';

@Component({
  selector: 'app-tax-group-list',
  standalone: false,
  templateUrl: './tax-group-list.component.html',
  styleUrl: './tax-group-list.component.css',
})
export class TaxGroupListComponent implements OnInit {
  taxGroups: TaxGroup[] = [];
  loading = true;
  errorMessage = '';

  page = 1;
  limit = 20;
  totalPages = 1;
  search = '';
  statusFilter = '1';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  drawerOpen = false;
  editId: number | null = null;
  saving = false;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private taxGroupsService: TaxGroupsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      category: ['GST'],
      rate: [null, Validators.required],
      is_inter_state: [false],
      tax_type: ['exclusive'],
      description: [''],
      is_active: [1],
    });
  }

  ngOnInit(): void {
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.taxGroupsService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.taxGroups = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load tax groups.';
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

  sgstDisplay(): string {
    const raw = this.form.getRawValue();
    if (raw.is_inter_state) return '—';
    const rate = parseFloat(raw.rate) || 0;
    return (rate / 2).toFixed(2) + '%';
  }

  cgstDisplay(): string {
    const raw = this.form.getRawValue();
    const rate = parseFloat(raw.rate) || 0;
    if (raw.is_inter_state) return rate.toFixed(2) + '% (IGST)';
    return (rate / 2).toFixed(2) + '%';
  }

  sgstForRow(g: TaxGroup): string {
    if (g.is_inter_state) return '—';
    return (parseFloat(String(g.rate)) / 2).toFixed(2) + '%';
  }

  cgstForRow(g: TaxGroup): string {
    const rate = parseFloat(String(g.rate));
    if (g.is_inter_state) return rate.toFixed(2) + '% (IGST)';
    return (rate / 2).toFixed(2) + '%';
  }

  categoryColor(cat: string): { bg: string; color: string; border: string } {
    const colors: Record<string, { bg: string; color: string; border: string }> = {
      GST: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
      VAT: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
      Custom: { bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
    };
    return colors[cat] || { bg: '#f6e7e9', color: '#2a1a20', border: '#efd6da' };
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', category: 'GST', rate: null, is_inter_state: false, tax_type: 'exclusive', description: '', is_active: 1 });
    this.drawerOpen = true;
  }

  openEdit(group: TaxGroup): void {
    this.taxGroupsService.getById(group.id).subscribe({
      next: (g) => {
        this.editId = g.id;
        this.form.reset({
          name: g.name,
          category: g.category || 'GST',
          rate: parseFloat(String(g.rate)),
          is_inter_state: !!g.is_inter_state,
          tax_type: g.tax_type || 'exclusive',
          description: g.description || '',
          is_active: g.is_active,
        });
        this.drawerOpen = true;
      },
      error: () => this.notify.error('Could not load tax group'),
    });
  }

  get drawerTitle(): string {
    return this.editId ? 'Edit Tax Group' : 'Add Tax Group';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    const rate = parseFloat(raw.rate);

    if (!name) {
      this.notify.warning('Tax name is required');
      return;
    }
    if (raw.rate === null || raw.rate === '' || isNaN(rate) || rate < 0 || rate > 100) {
      this.notify.warning('Percentage must be between 0 and 100');
      return;
    }

    const isInter = !!raw.is_inter_state;
    const components = isInter
      ? [{ name: 'IGST', rate }]
      : [
          { name: 'CGST', rate: Math.round((rate / 2) * 100) / 100 },
          { name: 'SGST', rate: Math.round((rate / 2) * 100) / 100 },
        ];

    const payload: Partial<TaxGroup> = {
      name,
      category: raw.category,
      tax_type: raw.tax_type,
      rate,
      is_inter_state: isInter ? 1 : 0,
      components,
      description: raw.description?.trim() || null,
      is_active: parseInt(raw.is_active, 10),
    };

    this.saving = true;
    const request$ = this.editId ? this.taxGroupsService.update(this.editId, payload) : this.taxGroupsService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Tax updated successfully' : 'Tax created successfully');
        this.closeDrawer();
        this.load(1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(group: TaxGroup): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Tax Group',
      message: `Delete "${group.name}"?`,
      note: 'Products using this group will lose their tax assignment.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.taxGroupsService.remove(group.id).subscribe({
      next: () => {
        this.notify.success('Tax group deleted');
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.editId = null;
  }
}
