export interface SalaryEmployee {
  id: number;
  name: string;
  role: string | null;
  monthly_salary: number;
  paid_amount: number;
  pending_salary: number;
}

export interface SalaryPayment {
  id: number;
  employee_id: number;
  salary_month: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
  Employee?: { name: string; role: string | null };
}
