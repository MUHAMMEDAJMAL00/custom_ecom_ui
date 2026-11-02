export interface JournalLine {
  id?: number;
  ledger_account_id: number;
  ledger_account?: { name: string };
  debit: number;
  credit: number;
  description: string | null;
}

export interface JournalEntry {
  id: number;
  reference_number: string;
  date: string;
  description: string | null;
  reference_type: string | null;
  reference_id: number | null;
  is_manual: number;
  lines?: JournalLine[];
}
