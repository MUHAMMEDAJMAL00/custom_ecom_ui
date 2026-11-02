export interface NoteLine {
  id?: number;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
}

export type NotePaymentStatus = 'Outstanding' | 'Settled';

export interface CreditNote {
  id: number;
  store_id: number;
  credit_note_number: string;
  date: string;
  customer_id: number | null;
  customer?: { id: number; name: string; phone?: string } | null;
  reference_invoice: string | null;
  payment_status: NotePaymentStatus;
  currency: string;
  notes: string | null;
  subtotal: number | string;
  lines?: NoteLine[];
  created_at: string;
}

export interface CreateCreditNotePayload {
  date: string;
  customer_id: number | null;
  reference_invoice: string | null;
  payment_status: NotePaymentStatus;
  notes: string | null;
  lines: NoteLine[];
}

export interface CreditNoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  payment_status?: string;
}
