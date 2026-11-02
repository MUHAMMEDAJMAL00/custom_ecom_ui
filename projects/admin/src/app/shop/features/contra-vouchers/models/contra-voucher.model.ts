export interface LedgerAccountRef {
  id: number;
  name: string;
}

export interface ContraVoucher {
  id: number;
  store_id: number;
  voucher_number: string;
  date: string;
  from_account_id: number;
  to_account_id: number;
  from_account?: LedgerAccountRef | null;
  to_account?: LedgerAccountRef | null;
  amount: number | string;
  payment_mode: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateContraVoucherPayload {
  date: string;
  amount: number;
  from_account_id: number;
  to_account_id: number;
  payment_mode: string | null;
  notes: string | null;
}

export interface ContraVoucherListParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
}
