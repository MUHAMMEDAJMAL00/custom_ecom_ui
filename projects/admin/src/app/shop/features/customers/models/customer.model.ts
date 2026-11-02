export interface Customer {
  id: number;
  store_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  loyalty_points: number;
  opening_balance: number;
  balance: number;
  notes: string | null;
  is_active: number;
}

export interface LoyaltyTransaction {
  id: number;
  customer_id: number;
  sale_id: number | null;
  transaction_type: 'earn' | 'redeem';
  points: number;
  balance_after: number;
  notes: string | null;
  created_at: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
