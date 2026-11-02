import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Employee } from '../../models/employee.model';
import { EmployeesService } from '../../services/employees.service';

type DrawerMode = 'form' | 'view' | 'pay' | null;

@Component({
  selector: 'app-employee-list',
  standalone: false,
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css',
})
export class EmployeeListComponent implements OnInit {
  allEmployees: Employee[] = [];
  employees: Employee[] = [];
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
  viewingEmployee: Employee | null = null;

  form: ReturnType<FormBuilder['group']>;
  payForm: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private employeesService: EmployeesService,
    private auth: AuthService,
    private notify: NotificationService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      role: [''],
      phone: [''],
      email: [''],
      monthly_salary: [0],
      joining_date: [''],
      is_active: [1],
    });
    const today = localDate(new Date());
    this.payForm = this.fb.group({
      salary_month: [today.slice(0, 7), Validators.required],
      amount: [0, Validators.required],
      payment_method: ['cash'],
      payment_date: [today],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.load(1);
  }

  load(page?: number): void {
    this.page = page ?? this.page;
    this.loading = true;
    this.errorMessage = '';
    this.employeesService
      .getAll({ search: this.search || undefined, is_active: this.statusFilter || undefined })
      .subscribe({
        next: (rows) => {
          this.allEmployees = rows;
          this.totalPages = Math.max(1, Math.ceil(rows.length / this.limit));
          this.page = Math.min(this.page, this.totalPages);
          this.applyPage();
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to load employees.';
          this.loading = false;
        },
      });
  }

  private applyPage(): void {
    const start = (this.page - 1) * this.limit;
    this.employees = this.allEmployees.slice(start, start + this.limit);
  }

  goToPage(page: number): void {
    this.page = page;
    this.applyPage();
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

  formatCurrency(n: number | string): string {
    return '₹' + parseFloat(String(n || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string | null): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  sortedPayments(emp: Employee): Employee['salary_payments'] {
    return [...(emp.salary_payments || [])].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }

  // ── Add / Edit ─────────────────────────────────────────────
  openAdd(): void {
    this.editId = null;
    this.form.reset({ name: '', role: '', phone: '', email: '', monthly_salary: 0, joining_date: '', is_active: 1 });
    this.drawerMode = 'form';
  }

  openEdit(employee: Employee): void {
    this.editId = employee.id;
    this.employeesService.getById(employee.id).subscribe({
      next: (e) => {
        this.form.reset({
          name: e.name,
          role: e.role || '',
          phone: e.phone || '',
          email: e.email || '',
          monthly_salary: parseFloat(String(e.monthly_salary || 0)),
          joining_date: e.joining_date || '',
          is_active: e.is_active,
        });
        this.drawerMode = 'form';
      },
      error: () => this.notify.error('Failed to load'),
    });
  }

  get drawerTitle(): string {
    if (this.drawerMode === 'view') return this.viewingEmployee?.name ?? 'Employee';
    if (this.drawerMode === 'pay') return 'Pay Salary';
    return this.editId ? 'Edit Employee' : 'Add Employee';
  }

  handleSave(): void {
    const raw = this.form.getRawValue();
    const name = (raw.name || '').trim();
    if (!name) {
      this.notify.warning('Employee name is required');
      return;
    }

    // New employees belong to the active store; edits never move them between stores
    if (!this.editId && !this.auth.activeStoreId) {
      this.notify.warning('Select a store in the header before adding an employee');
      return;
    }
    const payload: Partial<Employee> = {
      ...(this.editId ? {} : { store_id: this.auth.activeStoreId! }),
      name,
      role: raw.role?.trim() || null,
      phone: raw.phone?.trim() || null,
      email: raw.email?.trim() || null,
      monthly_salary: parseFloat(raw.monthly_salary) || 0,
      joining_date: raw.joining_date || null,
    } as Partial<Employee>;
    if (this.editId) (payload as any).is_active = parseInt(raw.is_active, 10);

    this.saving = true;
    const request$ = this.editId ? this.employeesService.update(this.editId, payload) : this.employeesService.create(payload);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editId ? 'Employee updated' : 'Employee added');
        this.closeDrawer();
        this.load(1);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err.error?.message || 'Save failed');
      },
    });
  }

  // ── View ───────────────────────────────────────────────────
  openView(employee: Employee): void {
    this.employeesService.getById(employee.id).subscribe({
      next: (e) => {
        this.viewingEmployee = e;
        this.drawerMode = 'view';
      },
      error: () => this.notify.error('Failed to load'),
    });
  }

  openPaySalary(): void {
    if (!this.viewingEmployee) return;
    const today = localDate(new Date());
    this.payForm.reset({
      salary_month: today.slice(0, 7),
      amount: parseFloat(String(this.viewingEmployee.monthly_salary || 0)),
      payment_method: 'cash',
      payment_date: today,
      notes: '',
    });
    this.drawerMode = 'pay';
  }

  backToView(): void {
    this.drawerMode = 'view';
  }

  handlePaySalary(): void {
    if (!this.viewingEmployee) return;
    const raw = this.payForm.getRawValue();
    if (!raw.salary_month) {
      this.notify.warning('Select salary month');
      return;
    }
    const amount = parseFloat(raw.amount);
    if (!amount) {
      this.notify.warning('Enter valid amount');
      return;
    }

    this.saving = true;
    this.employeesService
      .paySalary(this.viewingEmployee.id, {
        store_id: this.auth.activeStoreId ?? 0,
        salary_month: raw.salary_month,
        amount,
        payment_method: raw.payment_method,
        payment_date: raw.payment_date || undefined,
        notes: raw.notes?.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.notify.success('Salary recorded and posted to ledger');
          this.closeDrawer();
          this.load(this.page);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err.error?.message || 'Payment failed');
        },
      });
  }

  closeDrawer(): void {
    this.drawerMode = null;
    this.viewingEmployee = null;
    this.editId = null;
  }
}
