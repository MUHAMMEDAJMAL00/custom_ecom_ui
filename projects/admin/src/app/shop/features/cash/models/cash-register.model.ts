export interface CashMovement {
  id: number;
  cash_register_id: number;
  movement_type: 'cash_in' | 'cash_out' | 'sale' | 'refund' | string;
  amount: number;
  notes: string | null;
  created_at: string;
  createdAt: string;
}

export interface CashRegister {
  id: number;
  store_id: number;
  user_id: number;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number;
  difference: number | null;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
  movements?: CashMovement[];
  created_at: string;
}

export interface CashRegisterHistory {
  id: number;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number;
  difference: number | null;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}
