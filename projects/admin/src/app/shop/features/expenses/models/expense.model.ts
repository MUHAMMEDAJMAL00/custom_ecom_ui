export interface ExpenseCategory {
  id: number;
  store_id: number;
  name: string;
  description: string | null;
  is_active: number;
}

export interface Expense {
  id: number;
  store_id: number;
  user_id: number;
  category_id: number;
  category?: ExpenseCategory;
  title: string;
  description: string | null;
  amount: number;
  payment_method: 'cash' | 'bank' | 'upi';
  reference_number: string | null;
  expense_date: string;
  notes: string | null;
  status: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface BreakdownItem {
  category_id: number;
  category: string;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  grand_total: number;
  breakdown: BreakdownItem[];
}

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  payment_method?: string;
  from?: string;
  to?: string;
}
