export interface SalaryPayment {
  id: number;
  employee_id: number;
  salary_month: string;
  amount: number | string;
  payment_method: string;
  payment_date: string;
  notes: string | null;
}

export interface Employee {
  id: number;
  store_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  monthly_salary: number | string;
  joining_date: string | null;
  is_active: number;
  salary_payments?: SalaryPayment[];
}

export interface EmployeeListParams {
  search?: string;
  is_active?: string;
}

export interface PaySalaryPayload {
  store_id: number;
  salary_month: string;
  amount: number;
  payment_method: string;
  payment_date?: string;
  notes?: string;
}
