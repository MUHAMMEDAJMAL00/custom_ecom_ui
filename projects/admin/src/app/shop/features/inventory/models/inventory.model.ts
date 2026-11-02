export interface InventoryProductRef {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  unit: string | null;
  alert_quantity: number;
  max_quantity: number | null;
}

export interface StoreRef {
  id: number;
  name: string;
  code?: string;
}

export interface InventoryRow {
  id: number | null;
  product_id: number;
  store_id: number | null;
  quantity: string | number;
  reserved_quantity: string | number;
  Product: InventoryProductRef;
  Store: StoreRef | null;
}

export interface StockMovement {
  id: number;
  product_id: number;
  store_id: number;
  quantity_change: string | number;
  movement_type: string;
  notes: string | null;
  reference_type: string | null;
  reference_id: number | null;
  is_backorder?: boolean;
  createdAt?: string;
  created_at?: string;
  Product?: { id: number; name: string; sku: string } | null;
  Store?: StoreRef | null;
  Purchase?: { purchase_number: string } | null;
}

export interface ProductBatchRef {
  batch_number: string;
  expiry_date: string | null;
  purchase_rate: string | number;
  current_quantity: string | number;
  Store?: { name: string } | null;
}

export interface ProductInventoryDetail {
  product: { id: number; name: string; purchase_price: string | number };
  inventories: Array<{ store_id: number; quantity: string | number; reserved_quantity: string | number; Store?: StoreRef | null }>;
  batches: ProductBatchRef[];
  purchase_history: Array<{
    quantity: string | number;
    unit_cost: string | number;
    Purchase?: {
      id: number;
      purchase_number: string;
      purchase_date: string;
      Vendor?: { name: string } | null;
    } | null;
  }>;
}

export interface ProductSearchResult {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
}

export type AdjustType = 'add' | 'remove' | 'set';
