import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { AccountCategory, LedgerAccount } from '../../models/chart-of-accounts.model';
import { ChartOfAccountsService } from '../../services/chart-of-accounts.service';

@Component({
  selector: 'app-chart-of-accounts-list',
  standalone: false,
  templateUrl: './chart-of-accounts-list.component.html',
  styleUrl: './chart-of-accounts-list.component.css',
})
export class ChartOfAccountsListComponent implements OnInit {
  tab: 'categories' | 'accounts' = 'categories';

  cats: AccountCategory[] = [];
  catPage = 1; catLimit = 20; catTotal = 1; catLoading = false;
  catSearch = ''; catGroup = '';

  accs: LedgerAccount[] = [];
  accPage = 1; accLimit = 20; accTotal = 1; accLoading = false;
  accSearch = ''; accCategoryFilter = '';

  allCategories: AccountCategory[] = [];

  drawerOpen = false; drawerMode: 'cat' | 'acc' = 'cat'; editId: number | null = null; saving = false;
  formName = ''; formGroup = ''; formCategory = ''; formOpening = 0; formDesc = '';

  constructor(private service: ChartOfAccountsService, private notify: NotificationService) {}

  ngOnInit(): void { this.loadCatFilter(); this.loadCats(); }

  loadCats(p?: number): void {
    this.catPage = p ?? this.catPage; this.catLoading = true;
    this.service.getCategories({ page: this.catPage, limit: this.catLimit, search: this.catSearch || undefined, group: this.catGroup || undefined }).subscribe({
      next: (r) => { this.cats = r.data; this.catTotal = r.total_pages; this.catLoading = false; },
      error: () => { this.catLoading = false; },
    });
  }

  loadAccs(p?: number): void {
    this.accPage = p ?? this.accPage; this.accLoading = true;
    this.service.getAccounts({ page: this.accPage, limit: this.accLimit, search: this.accSearch || undefined, category_id: this.accCategoryFilter || undefined }).subscribe({
      next: (r) => { this.accs = r.data; this.accTotal = r.total_pages; this.accLoading = false; },
      error: () => { this.accLoading = false; },
    });
  }

  loadCatFilter(): void {
    this.service.getCategories({ limit: 200 }).subscribe({ next: (r) => { this.allCategories = r.data; }, error: () => {} });
  }

  switchTab(t: 'categories' | 'accounts'): void {
    this.tab = t;
    if (t === 'categories') this.loadCats(1); else this.loadAccs(1);
  }

  // ── Category drawer ──
  openCatAdd(): void { this.editId = null; this.formName = ''; this.formGroup = ''; this.drawerMode = 'cat'; this.drawerOpen = true; }
  openCatEdit(c: AccountCategory): void { this.editId = c.id; this.formName = c.name; this.formGroup = c.group; this.drawerMode = 'cat'; this.drawerOpen = true; }
  saveCat(): void {
    if (!this.formName.trim() || !this.formGroup) { this.notify.warning('Name and group required'); return; }
    this.saving = true;
    const obs = this.editId ? this.service.updateCategory(this.editId, { name: this.formName.trim(), group: this.formGroup }) : this.service.createCategory({ name: this.formName.trim(), group: this.formGroup });
    obs.subscribe({ next: () => { this.saving = false; this.notify.success(this.editId ? 'Category updated' : 'Category created'); this.drawerOpen = false; this.loadCats(1); this.loadCatFilter(); }, error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); } });
  }
  deleteCat(c: AccountCategory): void {
    if (!confirm('Delete category "' + c.name + '"?')) return;
    this.service.deleteCategory(c.id).subscribe({ next: () => { this.notify.success('Deleted'); this.loadCats(1); this.loadCatFilter(); }, error: () => this.notify.error('Delete failed') });
  }

  // ── Account drawer ──
  openAccAdd(): void { this.editId = null; this.formName = ''; this.formCategory = ''; this.formOpening = 0; this.formDesc = ''; this.drawerMode = 'acc'; this.drawerOpen = true; }
  openAccEdit(a: LedgerAccount): void { this.editId = a.id; this.formName = a.name; this.formCategory = String(a.category_id); this.formOpening = a.opening_balance; this.formDesc = a.description || ''; this.drawerMode = 'acc'; this.drawerOpen = true; }
  saveAcc(): void {
    if (!this.formName.trim() || !this.formCategory) { this.notify.warning('Name and category required'); return; }
    this.saving = true;
    const payload = { name: this.formName.trim(), category_id: parseInt(this.formCategory, 10), opening_balance: this.formOpening || 0, description: this.formDesc.trim() || null };
    const obs = this.editId ? this.service.updateAccount(this.editId, payload) : this.service.createAccount(payload);
    obs.subscribe({ next: () => { this.saving = false; this.notify.success(this.editId ? 'Account updated' : 'Account created'); this.drawerOpen = false; this.loadAccs(1); }, error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); } });
  }
  deleteAcc(a: LedgerAccount): void {
    if (!confirm('Delete account "' + a.name + '"?')) return;
    this.service.deleteAccount(a.id).subscribe({ next: () => { this.notify.success('Deleted'); this.loadAccs(1); }, error: () => this.notify.error('Delete failed') });
  }

  catAccountCount(c: AccountCategory): number { return c.ledger_accounts?.length || 0; }
  formatCurrency(n: number): string { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }); }
}
