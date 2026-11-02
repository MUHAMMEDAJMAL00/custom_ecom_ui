export type BatchStatus = 'active' | 'expiring' | 'expired';

export interface BatchRow {
  id: number;
  product_id: number;
  store_id: number;
  batch_number: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  current_quantity: string | number;
  initial_quantity: string | number;
  purchase_rate: string | number;
  createdAt?: string;
  Product?: { id: number; name: string; sku: string } | null;
}
