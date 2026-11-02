export interface DueCustomer {
  customer_id: number;
  name: string;
  phone: string | null;
  total_due: number;
  invoices: Array<{ sale_id: number; invoice_number: string; due_amount: number }>;
}

export interface CustomerPaymentRecord {
  id: number;
  store_id: number;
  customer_id: number;
  sale_id: number | null;
  user_id: number;
  amount: number | string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  payment_date: string;
  created_at: string;
  Customer?: { id: number; name: string; phone: string | null } | null;
  Sale?: { id: number; invoice_number: string } | null;
  User?: { id: number; name: string } | null;
}

export interface CustomerLedgerEntry {
  date: string;
  type: string;
  reference: string | number;
  debit: number;
  credit: number;
  description: string;
  balance: number;
}

export interface CustomerLedgerResponse {
  customer: { id: number; name: string; phone: string | null; balance: number | string };
  ledger: CustomerLedgerEntry[];
}

export interface DueSale {
  id: number;
  invoice_number: string;
  total_amount: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  created_at: string;
}

export interface CreateCustomerPaymentPayload {
  customer_id: number;
  sale_id: number | null;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
}
