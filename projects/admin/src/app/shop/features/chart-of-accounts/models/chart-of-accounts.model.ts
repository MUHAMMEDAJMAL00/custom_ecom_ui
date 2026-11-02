export interface AccountCategory {
  id: number;
  name: string;
  group: string;
  ledger_accounts?: LedgerAccount[];
}

export interface LedgerAccount {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  opening_balance: number;
  category?: { name: string; group: string };
}
