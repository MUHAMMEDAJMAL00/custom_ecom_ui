export interface PurchaseVendor {
  id: number;
  name: string;
  company: string | null;
  is_active: number;
}

export interface PurchaseProduct {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
  is_active: number;
  Variants?: PurchaseVariant[];
}

export interface PurchaseVariant {
  id: number;
  variant_name: string;
  purchase_price: number;
  is_active: number;
}

export interface PurchaseItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  variant_name?: string;
  ProductVariant?: { variant_name: string };
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  batch_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
}

export interface Purchase {
  id: number;
  store_id: number;
  vendor_id: number;
  user_id: number;
  purchase_number: string;
  purchase_date: string;
  status: 'pending' | 'received' | 'partial' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_charge: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  reference_number: string | null;
  notes: string | null;
  items?: PurchaseItem[];
  Vendor?: { name: string; company: string | null };
  items_count?: number;
  created_at: string;
}

export interface PurchaseListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: string;
}

export interface PurchasePaymentPayload {
  payment_method: string;
  amount: number;
  reference_number?: string | null;
  notes?: string | null;
}

export interface CreatePurchasePayload {
  vendor_id: number;
  purchase_date?: string;
  reference_number?: string;
  notes?: string;
  items: CreatePurchaseItem[];
}

export interface CreatePurchaseItem {
  product_id: number;
  variant_id?: number;
  quantity: number;
  unit_cost: number;
  batch_number?: string;
  manufacturing_date?: string;
  expiry_date?: string;
}
