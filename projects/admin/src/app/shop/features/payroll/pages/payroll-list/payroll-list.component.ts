import { localDate } from '../../../../core/utils/date.util';
import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../../../core/services/notification.service';
import { PayrollAdvance, PayrollEmployee, PayrollRun } from '../../models/payroll.model';
import { PayrollService } from '../../services/payroll.service';

@Component({
  selector: 'app-payroll-list',
  standalone: false,
  templateUrl: './payroll-list.component.html',
  styleUrl: './payroll-list.component.css',
})
export class PayrollListComponent implements OnInit {
  tab: 'dashboard' | 'history' | 'advances' = 'dashboard';

  // Dashboard
  dashboardEmployees: PayrollEmployee[] = [];
  dashboardSearch = '';
  stats: any = {};

  // History
  runs: PayrollRun[] = [];
  histPage = 1;
  histLimit = 20;
  histTotal = 1;
  histLoading = false;

  // Advances
  advances: PayrollAdvance[] = [];
  advPage = 1;
  advLimit = 20;
  advTotal = 1;
  advLoading = false;

  filterMonth = '';

  // Drawer state
  drawerOpen = false;
  drawerTitle = '';
  drawerMode: 'pay' | 'bulk' | 'advance' | 'view' = 'pay';
  saving = false;

  // Pay form
  payEmpId: number | null = null;
  payMonth = '';
  payDate = '';
  payGross: number | null = null;
  payMethod = 'Cash';
  payAdv = 0;
  payNotes = '';
  payLines: { type: string; label: string; amount: number }[] = [];
  payLineCounter = 0;

  // Bulk pay
  bulkDate = '';
  bulkMethod = 'Cash';

  // Advance form
  advEmpId: number | null = null;
  advDate = '';
  advAmount: number | null = null;
  advMethod = 'Cash';
  advNotes = '';

  // View run
  viewRun: PayrollRun | null = null;

  constructor(
    private service: PayrollService,
    private notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.filterMonth = new Date().toISOString().slice(0, 7);
    this.loadDashboard();
  }

  // ── Dashboard ──
  loadDashboard(): void {
    this.service.getSummary({ salary_month: this.filterMonth }).subscribe({
      next: (res) => {
        this.stats = res.stats || {};
        this.dashboardEmployees = res.employees || [];
      },
      error: () => {},
    });
  }

  get filteredDashboard(): PayrollEmployee[] {
    if (!this.dashboardSearch) return this.dashboardEmployees;
    const q = this.dashboardSearch.toLowerCase();
    return this.dashboardEmployees.filter((r) => r.name?.toLowerCase().includes(q));
  }

  get pendingEmployees(): PayrollEmployee[] {
    return this.dashboardEmployees.filter((r) => r.status !== 'Paid');
  }

  // ── History ──
  loadHistory(page?: number): void {
    this.histPage = page ?? this.histPage;
    this.histLoading = true;
    this.service.getRuns({ page: this.histPage, limit: this.histLimit, salary_month: this.filterMonth }).subscribe({
      next: (res) => { this.runs = res.data; this.histTotal = res.total_pages; this.histLoading = false; },
      error: () => { this.histLoading = false; },
    });
  }

  // ── Advances ──
  loadAdvances(page?: number): void {
    this.advPage = page ?? this.advPage;
    this.advLoading = true;
    this.service.getAdvances({ page: this.advPage, limit: this.advLimit }).subscribe({
      next: (res) => { this.advances = res.data; this.advTotal = res.total_pages; this.advLoading = false; },
      error: () => { this.advLoading = false; },
    });
  }

  switchTab(t: 'dashboard' | 'history' | 'advances'): void {
    this.tab = t;
    if (t === 'dashboard') this.loadDashboard();
    else if (t === 'history') this.loadHistory(1);
    else this.loadAdvances(1);
  }

  reload(): void { this.switchTab(this.tab); }

  // ── Pay form ──
  openPayForm(emp?: PayrollEmployee): void {
    this.payMonth = this.filterMonth;
    this.payDate = localDate(new Date());
    this.payMethod = 'Cash';
    this.payNotes = '';
    this.payAdv = 0;
    this.payLines = [];
    this.payLineCounter = 0;

    if (emp) {
      this.payEmpId = emp.id;
      this.payGross = emp.monthly_salary;
      this.payAdv = emp.outstanding_advance || 0;
      this.drawerTitle = 'Pay Salary — ' + emp.name;
    } else {
      this.payEmpId = null;
      this.payGross = null;
      this.drawerTitle = 'Pay Salary';
    }
    this.drawerMode = 'pay';
    this.drawerOpen = true;
  }

  calcNet(): number {
    const gross = this.payGross || 0;
    const allow = this.payLines.filter((l) => l.type === 'allowance').reduce((s, l) => s + (l.amount || 0), 0);
    const deduct = this.payLines.filter((l) => l.type === 'deduction').reduce((s, l) => s + (l.amount || 0), 0);
    return Math.max(0, gross + allow - deduct - (this.payAdv || 0));
  }

  addPayLine(type: string): void {
    this.payLines.push({ type, label: '', amount: 0 });
  }

  removePayLine(i: number): void {
    this.payLines.splice(i, 1);
  }

  submitPay(): void {
    if (!this.payEmpId || !this.payMonth || !this.payDate || !this.payGross || this.payGross <= 0) {
      this.notify.warning('Employee, month, date, and gross salary are required');
      return;
    }
    this.saving = true;
    this.service.createRun({
      employee_id: this.payEmpId,
      salary_month: this.payMonth,
      gross_salary: this.payGross,
      allowances: this.payLines.filter((l) => l.type === 'allowance' && l.label).map((l) => ({ label: l.label, amount: l.amount })),
      deductions: this.payLines.filter((l) => l.type === 'deduction' && l.label).map((l) => ({ label: l.label, amount: l.amount })),
      advance_deducted: this.payAdv || 0,
      payment_method: this.payMethod,
      payment_date: this.payDate,
      notes: this.payNotes.trim() || null,
    }).subscribe({
      next: () => { this.saving = false; this.notify.success('Salary processed'); this.drawerOpen = false; this.loadDashboard(); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); },
    });
  }

  // ── Bulk pay ──
  openBulkPay(): void {
    if (!this.pendingEmployees.length) { this.notify.warning('No pending employees for this month'); return; }
    this.bulkDate = localDate(new Date());
    this.bulkMethod = 'Cash';
    this.drawerMode = 'bulk';
    this.drawerTitle = 'Bulk Pay Salary';
    this.drawerOpen = true;
  }

  submitBulk(): void {
    const selected = this.pendingEmployees;
    if (!selected.length) { this.notify.warning('No employees selected'); return; }
    this.saving = true;
    this.service.bulkRun(selected.map((r) => ({
      employee_id: r.id,
      salary_month: this.filterMonth,
      gross_salary: r.monthly_salary || 0,
      advance_deducted: r.outstanding_advance || 0,
      payment_method: this.bulkMethod,
      payment_date: this.bulkDate,
    }))).subscribe({
      next: () => { this.saving = false; this.notify.success('Bulk salary processed for ' + selected.length + ' employee(s)'); this.drawerOpen = false; this.loadDashboard(); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Bulk pay failed'); },
    });
  }

  // ── Advance form ──
  openAdvanceForm(): void {
    this.advDate = localDate(new Date());
    this.advAmount = null;
    this.advMethod = 'Cash';
    this.advNotes = '';
    this.drawerMode = 'advance';
    this.drawerTitle = 'Give Advance';
    this.drawerOpen = true;
  }

  submitAdvance(): void {
    if (!this.advEmpId || !this.advDate || !this.advAmount || this.advAmount <= 0) {
      this.notify.warning('Employee, date, and amount are required');
      return;
    }
    this.saving = true;
    this.service.createAdvance({
      employee_id: this.advEmpId,
      amount: this.advAmount,
      date: this.advDate,
      payment_method: this.advMethod,
      notes: this.advNotes.trim() || null,
    }).subscribe({
      next: () => { this.saving = false; this.notify.success('Advance recorded'); this.drawerOpen = false; this.loadAdvances(1); this.loadDashboard(); },
      error: (err) => { this.saving = false; this.notify.error(err.error?.message || 'Save failed'); },
    });
  }

  // ── View run ──
  openViewRun(r: PayrollRun): void {
    this.viewRun = r;
    this.drawerMode = 'view';
    this.drawerTitle = 'Payroll Run — ' + (r.employee?.name || '');
    this.drawerOpen = true;
  }

  get allEmployees(): any[] {
    return this.dashboardEmployees.map((r) => ({ id: r.id, name: r.name, monthly_salary: r.monthly_salary }));
  }

  // ── Drawer save ──
  handleSave(): void {
    if (this.drawerMode === 'pay') this.submitPay();
    else if (this.drawerMode === 'bulk') this.submitBulk();
    else if (this.drawerMode === 'advance') this.submitAdvance();
  }

  calcNetPay(monthly: number, advance: number): number {
    return Math.max(0, (monthly || 0) - (advance || 0));
  }

  formatCurrency(n: number | string): string {
    return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(s: string): string {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
