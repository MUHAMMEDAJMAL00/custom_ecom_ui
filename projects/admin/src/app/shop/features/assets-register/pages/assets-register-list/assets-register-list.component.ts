import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { Asset } from '../../models/asset.model';
import { AssetsService } from '../../services/assets.service';

@Component({
  selector: 'app-assets-register-list',
  standalone: false,
  templateUrl: './assets-register-list.component.html',
  styleUrl: './assets-register-list.component.css',
})
export class AssetsRegisterListComponent implements OnInit {
  assets: Asset[] = [];
  loading = false;
  page = 1; limit = 20; total = 1;
  search = ''; filterStatus = '';

  drawerOpen = false; drawerMode: 'view' | 'form' = 'form'; editId: number | null = null; saving = false;
  viewingAsset: Asset | null = null;

  formName = ''; formCategory = ''; formPurchaseDate = ''; formPurchaseValue: number | null = null;
  formDeprRate: number | null = null; formStatus = 'Active'; formNotes = '';

  // Depreciation fields in view
  deprAmount: number | null = null;
  deprDate = '';

  constructor(private service: AssetsService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.deprDate = this.today();
    this.load();
  }

  today(): string { return localDate(new Date()); }

  load(p?: number): void {
    this.page = p ?? this.page; this.loading = true;
    this.service.getAll({ page: this.page, limit: this.limit, search: this.search || undefined, status: this.filterStatus || undefined }).subscribe({
      next: (r) => { this.assets = r.data; this.total = r.total_pages; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  // ── View ──
  openView(a: Asset): void {
    this.viewingAsset = a;
    this.deprAmount = null;
    this.deprDate = this.today();
    this.drawerMode = 'view';
    this.drawerOpen = true;
  }

  postDepreciation(): void {
    if (!this.deprAmount || this.deprAmount <= 0 || !this.viewingAsset) { this.notify.warning('Enter depreciation amount'); return; }
    this.saving = true;
    this.service.postDepreciation(this.viewingAsset.id, { amount: this.deprAmount, date: this.deprDate }).subscribe({
      next: () => { this.saving = false; this.notify.success('Depreciation posted'); this.drawerOpen = false; this.load(); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Failed'); },
    });
  }

  // ── Form ──
  openAdd(): void {
    this.editId = null; this.formName = ''; this.formCategory = ''; this.formPurchaseDate = this.today();
    this.formPurchaseValue = null; this.formDeprRate = null; this.formNotes = '';
    this.drawerMode = 'form'; this.drawerOpen = true;
  }

  openEdit(a: Asset): void {
    this.editId = a.id; this.formName = a.name; this.formCategory = a.category || '';
    this.formPurchaseDate = a.purchase_date || this.today(); this.formPurchaseValue = a.purchase_value;
    this.formDeprRate = a.depreciation_rate; this.formStatus = a.status; this.formNotes = a.notes || '';
    this.drawerMode = 'form'; this.drawerOpen = true;
  }

  save(): void {
    if (!this.formName.trim()) { this.notify.warning('Asset name is required'); return; }
    this.saving = true;
    const payload: any = { name: this.formName.trim(), category: this.formCategory.trim() || null, purchase_date: this.formPurchaseDate || null, purchase_value: this.formPurchaseValue || 0, depreciation_rate: this.formDeprRate || 0, notes: this.formNotes.trim() || null };
    if (this.editId) { payload.status = this.formStatus; }
    const obs = this.editId ? this.service.update(this.editId, payload) : this.service.create(payload);
    obs.subscribe({
      next: () => { this.saving = false; this.notify.success(this.editId ? 'Asset updated' : 'Asset created'); this.drawerOpen = false; this.load(); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); },
    });
  }

  formatCurrency(n: number): string { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
}
