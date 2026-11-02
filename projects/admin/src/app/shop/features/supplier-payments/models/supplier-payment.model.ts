export interface DueVendor {
  vendor_id: number;
  name: string;
  phone: string | null;
  total_due: number;
  purchases: Array<{ purchase_id: number; purchase_number: string; due_amount: number }>;
}

export interface SupplierPaymentRecord {
  id: number;
  store_id: number;
  vendor_id: number;
  purchase_id: number | null;
  user_id: number;
  amount: number | string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  payment_date: string;
  created_at: string;
  Vendor?: { id: number; name: string; phone: string | null } | null;
  Purchase?: { id: number; purchase_number: string } | null;
  User?: { id: number; name: string } | null;
}

export interface SupplierLedgerEntry {
  date: string;
  type: string;
  ref: string | number;
  description: string;
  amount: number;
  is_debt: boolean;
  balance: number;
}

export interface SupplierLedgerResponse {
  vendor: { id: number; name: string; phone: string | null; opening_balance: number; current_balance: number };
  ledger: SupplierLedgerEntry[];
}

export interface DuePurchase {
  id: number;
  purchase_number: string;
  total_amount: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  created_at: string;
}

export interface CreateSupplierPaymentPayload {
  vendor_id: number;
  purchase_id: number | null;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}
