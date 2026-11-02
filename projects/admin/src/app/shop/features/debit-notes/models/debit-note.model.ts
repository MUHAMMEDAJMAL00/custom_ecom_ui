export interface NoteLine {
  id?: number;
  description: string;
  qty: number | string;
  rate: number | string;
  amount: number | string;
}

export type NotePaymentStatus = 'Outstanding' | 'Settled';

export interface DebitNote {
  id: number;
  store_id: number;
  debit_note_number: string;
  date: string;
  vendor_id: number | null;
  vendor?: { id: number; name: string; phone?: string } | null;
  reference_bill: string | null;
  payment_status: NotePaymentStatus;
  currency: string;
  notes: string | null;
  subtotal: number | string;
  lines?: NoteLine[];
  created_at: string;
}

export interface CreateDebitNotePayload {
  date: string;
  vendor_id: number | null;
  reference_bill: string | null;
  payment_status: NotePaymentStatus;
  notes: string | null;
  lines: NoteLine[];
}

export interface DebitNoteListParams {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  payment_status?: string;
}
