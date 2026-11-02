import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Expense, ExpenseCategory, ExpenseSummary } from '../../models/expense.model';
import { ExpensesService } from '../../services/expenses.service';

type DrawerMode = 'expense' | 'category' | null;

@Component({
  selector: 'app-expense-list',
  standalone: false,
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.css',
})
export class ExpenseListComponent implements OnInit {
  activeTab: 'expenses' | 'categories' = 'expenses';

  // Summary
  summary: ExpenseSummary | null = null;
  summaryLoading = false;

  // Expenses
  expenses: Expense[] = [];
  expensesLoading = true;
  expensesError = '';

  page = 1;
  limit = 10;
  totalPages = 1;
  searchExp = '';
  filterCategory = '';
  filterDateFrom = '';
  filterDateTo = '';
  private searchDebounce?: ReturnType<typeof setTimeout>;

  // Categories
  categories: ExpenseCategory[] = [];
  categoriesLoading = false;

  // Drawer
  drawerMode: DrawerMode = null;
  editId: number | null = null;
  saving = false;

  expForm;
  catForm;

  constructor(
    private fb: FormBuilder,
    private service: ExpensesService,
    private notify: NotificationService,
    private confirmService: ConfirmService,
  ) {
    this.expForm = this.fb.group({
      title: ['', Validators.required],
      category_id: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      expense_date: [this.todayISO(), Validators.required],
      payment_method: ['cash'],
      description: [''],
      reference_number: [''],
      notes: [''],
    });

    this.catForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  todayISO(): string {
    return localDate(new Date());
  }

  loadAll(): void {
    this.loadSummary();
    this.loadCategories();
    this.loadExpenses(1);
  }

  loadSummary(): void {
    this.summaryLoading = true;
    this.service.getSummary().subscribe({
      next: (s) => { this.summary = s; this.summaryLoading = false; },
      error: () => { this.summaryLoading = false; },
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.service.getCategories().subscribe({
      next: (list) => { this.categories = list; this.categoriesLoading = false; },
      error: () => { this.categoriesLoading = false; },
    });
  }

  loadExpenses(page?: number): void {
    this.page = page ?? this.page;
    this.expensesLoading = true;
    this.expensesError = '';
    this.service.getAll({
      page: this.page,
      limit: this.limit,
      search: this.searchExp || undefined,
      category_id: this.filterCategory || undefined,
      from: this.filterDateFrom || undefined,
      to: this.filterDateTo || undefined,
    }).subscribe({
      next: (res) => {
        this.expenses = res.data;
        this.totalPages = res.total_pages;
        this.expensesLoading = false;
      },
      error: (err) => {
        this.expensesError = err.error?.message || 'Failed to load expenses.';
        this.expensesLoading = false;
      },
    });
  }

  switchTab(tab: 'expenses' | 'categories'): void {
    this.activeTab = tab;
    if (tab === 'expenses') this.loadSummary();
    if (tab === 'categories') this.loadCategories();
  }

  // ── Expense filters ──
  onSearchExpInput(value: string): void {
    this.searchExp = value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadExpenses(1), 250);
  }

  applyExpFilter(): void {
    this.loadExpenses(1);
  }

  // ── Expense drawer ──
  openAddExpense(): void {
    this.editId = null;
    this.expForm.reset({
      title: '', category_id: '', amount: null,
      expense_date: this.todayISO(), payment_method: 'cash',
      description: '', reference_number: '', notes: '',
    });
    this.drawerMode = 'expense';
  }

  openEditExpense(item: Expense): void {
    this.editId = item.id;
    this.expForm.reset({
      title: item.title || '',
      category_id: String(item.category_id || ''),
      amount: item.amount as any,
      expense_date: (item.expense_date || '').slice(0, 10),
      payment_method: item.payment_method || 'cash',
      description: item.description || '',
      reference_number: item.reference_number || '',
      notes: item.notes || '',
    });
    this.drawerMode = 'expense';
  }

  saveExpense(): void {
    if (this.expForm.invalid) {
      this.notify.warning('Fill in all required fields');
      return;
    }
    const raw = this.expForm.getRawValue();
    const payload: any = {
      title: (raw.title || '').trim(),
      category_id: parseInt(raw.category_id || '0', 10),
      amount: parseFloat(String(raw.amount ?? '0')),
      expense_date: raw.expense_date,
      payment_method: raw.payment_method || 'cash',
    };
    if (raw.description?.trim()) payload.description = raw.description.trim();
    if (raw.reference_number?.trim()) payload.reference_number = raw.reference_number.trim();
    if (raw.notes?.trim()) payload.notes = raw.notes.trim();

    this.saving = true;
    const request$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Expense updated' : 'Expense saved');
        this.closeDrawer();
        this.loadExpenses(1);
        this.loadSummary();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Failed to save expense');
      },
    });
  }

  confirmDeleteExpense(item: Expense): void {
    this.confirmService.show({
      title: 'Delete Expense?',
      message: `Delete "${item.title || 'this expense'}"?`,
      note: 'This action cannot be undone.',
      confirmLabel: 'Delete',
    }).then((confirmed) => {
      if (!confirmed) return;
      this.service.remove(item.id).subscribe({
        next: () => {
          this.notify.success('Expense deleted');
          this.loadExpenses(1);
          this.loadSummary();
        },
        error: () => this.notify.error('Failed to delete expense'),
      });
    });
  }

  // ── Category drawer ──
  openAddCategory(): void {
    this.editId = null;
    this.catForm.reset({ name: '', description: '' });
    this.drawerMode = 'category';
  }

  openEditCategory(item: ExpenseCategory): void {
    this.editId = item.id;
    this.catForm.reset({ name: item.name || '', description: item.description || '' });
    this.drawerMode = 'category';
  }

  saveCategory(): void {
    if (this.catForm.invalid) {
      this.notify.warning('Name is required');
      return;
    }
    const raw = this.catForm.getRawValue();
    const payload: any = { name: (raw.name || '').trim() };
    if (raw.description?.trim()) payload.description = raw.description.trim();

    this.saving = true;
    const request$ = this.editId
      ? this.service.updateCategory(this.editId, payload)
      : this.service.createCategory(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Category updated' : 'Category created');
        this.closeDrawer();
        this.loadCategories();
        this.loadSummary();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Failed to save category');
      },
    });
  }

  confirmDeleteCategory(item: ExpenseCategory): void {
    this.confirmService.show({
      title: 'Delete Category?',
      message: `Delete category "${item.name}"?`,
      note: 'Expenses in this category will lose their category reference.',
      confirmLabel: 'Delete',
    }).then((confirmed) => {
      if (!confirmed) return;
      this.service.removeCategory(item.id).subscribe({
        next: () => {
          this.notify.success('Category deleted');
          this.loadCategories();
          this.loadSummary();
        },
        error: () => this.notify.error('Failed to delete category'),
      });
    });
  }

  // ── Drawer ──
  get drawerTitle(): string {
    if (this.drawerMode === 'category') return this.editId ? 'Edit Category' : 'Add Category';
    return this.editId ? 'Edit Expense' : 'Add Expense';
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.editId = null;
  }

  handleSave(): void {
    if (this.drawerMode === 'category') this.saveCategory();
    else this.saveExpense();
  }

  // ── Helpers ──
  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  categoryName(id: number): string {
    const c = this.categories.find((x) => x.id === id);
    return c ? c.name : '—';
  }

  methodBadge(method: string): { label: string; css: string } {
    const map: Record<string, string> = { cash: 'badge-method-cash', bank: 'badge-method-bank', upi: 'badge-method-upi' };
    return { label: method ? method.charAt(0).toUpperCase() + method.slice(1) : '—', css: map[method] || '' };
  }

  getMonthCount(): number {
    if (!this.summary) return 0;
    return this.summary.breakdown.reduce((a, b) => a + b.count, 0);
  }
}
