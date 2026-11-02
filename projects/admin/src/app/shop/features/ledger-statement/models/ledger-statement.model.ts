export interface LedgerStatementLine {
  date: string;
  reference_number: string | null;
  description: string | null;
  reference_type: string | null;
  reference_id: number | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerStatementData {
  account?: { id: number; name: string; opening_balance: number; category?: { name: string; group: string } };
  lines?: LedgerStatementLine[];
  closing_balance?: number;
}
