export interface ProductRef {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
}

export interface WastageEntry {
  id: number;
  product_id: number;
  store_id: number;
  quantity: number;
  reason: string;
  notes: string | null;
  reference_number: string | null;
  Product?: { name: string; sku: string };
  created_at: string;
  createdAt: string;
}

export interface VendorReturnEntry {
  id: number;
  vendor_id: number;
  product_id: number;
  store_id: number;
  purchase_id: number | null;
  quantity: number;
  reason: string;
  notes: string | null;
  reference_number: string | null;
  return_action: string;
  refund_amount: number;
  Product?: { name: string; sku: string };
  Vendor?: { name: string };
  created_at: string;
  createdAt: string;
}
