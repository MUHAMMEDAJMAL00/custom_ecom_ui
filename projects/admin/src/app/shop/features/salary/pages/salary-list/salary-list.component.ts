import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { SalaryEmployee, SalaryPayment } from '../../models/salary.model';
import { SalaryService } from '../../services/salary.service';

@Component({
  selector: 'app-salary-list',
  standalone: false,
  templateUrl: './salary-list.component.html',
  styleUrl: './salary-list.component.css',
})
export class SalaryListComponent implements OnInit {
  tab: 'status' | 'history' = 'status';

  // Status tab
  employees: SalaryEmployee[] = [];
  statusLoading = false;
  search = '';

  // History tab
  payments: SalaryPayment[] = [];
  histLoading = false;
  histPage = 1;
  histLimit = 20;
  histTotal = 1;

  // Month filter
  filterMonth = '';

  // Pay drawer
  drawerOpen = false;
  saving = false;
  payEmpList: any[] = [];
  payEmpId: number | null = null;
  payMonth = '';
  payAmount: number | null = null;
  payMethod = 'cash';
  payDate = '';
  payNotes = '';

  constructor(
    private service: SalaryService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.filterMonth = new Date().toISOString().slice(0, 7);
    this.payMonth = this.filterMonth;
    this.loadStatus();
    this.service.getEmployees({ is_active: 1 }).subscribe({ next: (r) => { this.payEmpList = r; } });
  }

  // ── Stats ──
  get totalPayroll(): number { return this.employees.reduce((s, e) => s + (e.monthly_salary || 0), 0); }
  get totalPaid(): number { return this.employees.reduce((s, e) => s + (e.paid_amount || 0), 0); }
  get totalPending(): number { return this.employees.reduce((s, e) => s + (e.pending_salary || 0), 0); }
  get fullyPaidCount(): number { return this.employees.filter((e) => (e.pending_salary || 0) <= 0).length; }

  // ── Load ──
  loadStatus(): void {
    this.statusLoading = true;
    this.service.getSalaryStatus({ salary_month: this.filterMonth }).subscribe({
      next: (list) => { this.employees = list; this.statusLoading = false; },
      error: () => { this.statusLoading = false; },
    });
  }

  loadHistory(page?: number): void {
    this.histPage = page ?? this.histPage;
    this.histLoading = true;
    this.service.getPaymentHistory({
      page: this.histPage,
      limit: this.histLimit,
      salary_month: this.filterMonth,
    }).subscribe({
      next: (res) => { this.payments = res.data; this.histTotal = res.total_pages; this.histLoading = false; },
      error: () => { this.histLoading = false; },
    });
  }

  switchTab(t: 'status' | 'history'): void {
    this.tab = t;
    if (t === 'status') this.loadStatus();
    else this.loadHistory(1);
  }

  reload(): void {
    if (this.tab === 'status') this.loadStatus();
    else this.loadHistory(1);
  }

  // ── Filtered employees ──
  get filteredEmployees(): SalaryEmployee[] {
    if (!this.search) return this.employees;
    const q = this.search.toLowerCase();
    return this.employees.filter((e) =>
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.role && e.role.toLowerCase().includes(q))
    );
  }

  // ── Pay drawer ──
  getPayrollStats(): { total: number; paid: number; pending: number; count: number } {
    return {
      total: this.totalPayroll,
      paid: this.totalPaid,
      pending: this.totalPending,
      count: this.fullyPaidCount,
    };
  }

  openPayDrawer(emp?: SalaryEmployee): void {
    if (emp) {
      this.payEmpId = emp.id;
      this.payAmount = emp.pending_salary;
    } else {
      this.payEmpId = null;
      this.payAmount = null;
    }
    this.payMonth = this.filterMonth;
    this.payDate = localDate(new Date());
    this.payMethod = 'cash';
    this.payNotes = '';
    this.drawerOpen = true;
  }

  onPayEmpChange(): void {
    if (!this.payEmpId) return;
    const emp = this.payEmpList.find((e) => e.id === this.payEmpId);
    if (emp && emp.monthly_salary) this.payAmount = emp.monthly_salary;
  }

  submitPay(): void {
    if (!this.payEmpId || !this.payAmount || this.payAmount <= 0 || !this.payMonth) {
      this.notify.warning('Fill all required fields');
      return;
    }
    this.saving = true;
    this.service.paySalary(this.payEmpId, {
      salary_month: this.payMonth,
      amount: this.payAmount,
      payment_method: this.payMethod,
      payment_date: this.payDate || undefined,
      notes: this.payNotes.trim() || undefined,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Salary recorded');
        this.drawerOpen = false;
        this.reload();
      },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Payment failed'); },
    });
  }

  formatCurrency(n: number | string): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
