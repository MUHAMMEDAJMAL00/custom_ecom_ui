export interface PurchaseReturnVendor {
  id: number;
  name: string;
  company: string | null;
  is_active: number;
}

export interface PurchaseReturnProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  purchase_price: number;
  tax_rate?: number;
  is_active: number;
}

export interface PurchaseReturnItemData {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_amount?: number;
  Product?: { name: string };
}

export interface PurchaseReturn {
  id: number;
  return_number: string;
  store_id: number;
  vendor_id: number;
  purchase_id: number | null;
  return_date: string;
  status: 'draft' | 'approved' | 'completed' | 'rejected';
  refund_method: string | null;
  refund_status: string | null;
  reason: string | null;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  refund_amount: number;
  items?: PurchaseReturnItemData[];
  Vendor?: { name: string; company: string | null };
  Purchase?: { purchase_number: string };
  created_at: string;
}

export interface CreatePurchaseReturnItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  /** GST % on the original purchase; drives the refund and input-tax reversal */
  tax_rate: number;
}

export interface CreatePurchaseReturnPayload {
  vendor_id: number;
  purchase_id?: number | null;
  return_date?: string;
  reason?: string;
  refund_method: string;
  items: CreatePurchaseReturnItem[];
}

export interface PurchaseRef {
  id: number;
  purchase_number: string;
  total_amount: number;
  status: string;
}
