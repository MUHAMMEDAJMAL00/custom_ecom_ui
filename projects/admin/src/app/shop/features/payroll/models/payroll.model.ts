export interface PayrollEmployee {
  id: number;
  name: string;
  role: string | null;
  monthly_salary: number;
  outstanding_advance: number;
  status: string;
  paid_via_salary?: number;
  payroll_run?: { net_payable: number };
}

export interface PayrollStats {
  total_payroll: number;
  total_paid: number;
  total_pending: number;
  total_advance: number;
}

export interface PayrollRun {
  id: number;
  employee_id: number;
  salary_month: string;
  gross_salary: number;
  total_allowances: number;
  total_deductions: number;
  advance_deducted: number;
  net_payable: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  employee?: { name: string };
  lines?: PayrollRunLine[];
}

export interface PayrollRunLine {
  label: string;
  line_type: 'allowance' | 'deduction';
  amount: number;
}

export interface PayrollAdvance {
  id: number;
  employee_id: number;
  amount: number;
  date: string;
  payment_method: string;
  status: string;
  notes: string | null;
  employee?: { name: string };
}
