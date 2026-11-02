import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Unit, UomValue } from '../../models/unit.model';
import { UnitsService } from '../../services/units.service';

type DrawerMode = 'form' | 'view' | null;

@Component({
  selector: 'app-unit-list',
  standalone: false,
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.css',
})
export class UnitListComponent implements OnInit {
  units: Unit[] = [];
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
  viewingUnit: Unit | null = null;

  currentValues: UomValue[] = [];
  pendingValues: number[] = [];
  toRemove: number[] = [];
  newValueInput: number | null = null;

  form: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private unitsService: UnitsService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      symbol: [''],
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
    this.unitsService
      .getAll({ page: this.page, limit: this.limit, search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (res) => {
          this.units = res.data;
          this.totalPages = res.total_pages;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load units.';
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

  formatValue(v: string | number): string {
    return String(parseFloat(String(v)));
  }

  get allValueTags(): Array<{ id: number | null; label: string; existing: boolean }> {
    return [
      ...this.currentValues.map((v) => ({ id: v.id, label: this.formatValue(v.value), existing: true })),
      ...this.pendingValues.map((v) => ({ id: null, label: this.formatValue(v), existing: false })),
    ];
  }

  addPendingValue(): void {
    const val = this.newValueInput;
    if (!val || isNaN(val) || val <= 0) {
      this.notify.warning('Enter a positive number');
      return;
    }
    const rounded = Math.round(val * 1000) / 1000;
    const isDup =
      this.currentValues.some((v) => Math.abs(parseFloat(String(v.value)) - rounded) < 0.0001) ||
      this.pendingValues.some((v) => Math.abs(v - rounded) < 0.0001);
    if (isDup) {
      this.notify.warning(`Value ${rounded} already in list`);
      return;
    }
    this.pendingValues.push(rounded);
    this.newValueInput = null;
  }

  removeValueTag(tag: { id: number | null; label: string; existing: boolean }): void {
    if (tag.existing && tag.id) {
      this.currentValues = this.currentValues.filter((v) => v.id !== tag.id);
      this.toRemove.push(tag.id);
    } else {
      const labelNum = parseFloat(tag.label);
      this.pendingValues = this.pendingValues.filter((v) => Math.abs(v - labelNum) >= 0.0001);
    }
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.currentValues = [];
    this.pendingValues = [];
    this.toRemove = [];
    this.newValueInput = null;
    this.form.reset({ name: '', symbol: '', is_active: 1 });
    this.drawerMode = 'form';
  }

  openEdit(unit: Unit): void {
    this.unitsService.getById(unit.id).subscribe({
      next: (u) => {
        this.editId = u.id;
        this.currentValues = (u.UomValues || []).filter((v) => v.is_active);
        this.pendingValues = [];
        this.toRemove = [];
        this.newValueInput = null;
        this.form.reset({ name: u.name, symbol: u.symbol || '', is_active: u.is_active });
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Could not load unit'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return 'Unit Details';
    return this.editId ? 'Edit Unit' : 'Add Unit';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim().toUpperCase();
    if (!name) {
      this.notify.warning('Unit name is required');
      return;
    }

    const payload: Partial<Unit> = {
      name,
      symbol: (raw.symbol || '').trim().toUpperCase() || null,
      is_active: parseInt(raw.is_active, 10),
    };

    this.saving = true;
    const request$ = this.editId ? this.unitsService.update(this.editId, payload) : this.unitsService.create(payload);
    request$.subscribe({
      next: (unit) => {
        const savedId = this.editId || unit.id;
        const removals: Observable<unknown>[] = this.toRemove.map((valId) => this.unitsService.removeValue(savedId, valId));
        const additions: Observable<unknown>[] = this.pendingValues.map((val) => this.unitsService.addValue(savedId, val));
        const ops: Observable<unknown>[] = [...removals, ...additions];

        const finish = () => {
          this.saving = false;
          this.notify.success(this.editId ? 'Unit updated' : 'Unit created');
          this.closeDrawer();
          this.load();
        };

        if (!ops.length) {
          finish();
          return;
        }
        let remaining = ops.length;
        ops.forEach((op) =>
          op.subscribe({
            next: () => {
              if (--remaining === 0) finish();
            },
            error: () => {
              if (--remaining === 0) finish();
            },
          }),
        );
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  // ── View ───────────────────────────────────────────────────
  openView(unit: Unit): void {
    this.unitsService.getById(unit.id).subscribe({
      next: (u) => {
        this.viewingUnit = { ...u, UomValues: (u.UomValues || []).filter((v) => v.is_active) };
        this.drawerMode = 'view';
      },
      error: () => this.notify.error('Could not load unit'),
    });
  }

  // ── Delete ─────────────────────────────────────────────────
  async confirmDelete(unit: Unit): Promise<void> {
    const confirmed = await this.confirmService.show({
      title: 'Delete Unit',
      message: `Delete "${unit.name}"?`,
      note: 'This cannot be undone.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    this.unitsService.remove(unit.id).subscribe({
      next: () => {
        this.notify.success('Unit deleted');
        this.load(1);
      },
      error: (err) => this.notify.error(err.error?.message || 'Delete failed'),
    });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingUnit = null;
    this.editId = null;
  }
}
