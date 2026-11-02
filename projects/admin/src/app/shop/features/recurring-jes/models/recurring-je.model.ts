export interface RecurringJELine {
  id?: number;
  recurring_je_id?: number;
  ledger_account_id: number;
  account_name?: string;
  debit: number;
  credit: number;
  description: string | null;
}

export interface RecurringJE {
  id: number;
  name: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month?: number;
  day_of_week?: number;
  start_date: string;
  end_date: string | null;
  next_run_date: string;
  last_run_date: string | null;
  is_active: number;
  notes: string | null;
  lines?: RecurringJELine[];
}
