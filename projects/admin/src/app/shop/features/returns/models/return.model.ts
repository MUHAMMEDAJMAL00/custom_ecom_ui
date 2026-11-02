export interface ReturnSaleRef {
  id: number;
  invoice_number: string;
}

export interface ReturnCustomerRef {
  id: number;
  name: string;
  phone: string | null;
}

export interface ReturnUserRef {
  id: number;
  name: string;
}

export interface ReturnStoreRef {
  id: number;
  name: string;
  code: string;
}

export interface ReturnItemRow {
  id: number;
  sale_item_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  total_amount: number | string;
  restock: number;
  ProductVariant?: { id: number; variant_name: string } | null;
}

export interface ReturnRecord {
  id: number;
  return_number: string;
  sale_id: number;
  store_id: number;
  user_id: number;
  customer_id: number | null;
  return_reason: string | null;
  total_amount: number | string;
  restocking_fee: number | string;
  refund_method: string;
  status: string;
  notes: string | null;
  created_at: string;
  return_date?: string;
  Sale?: ReturnSaleRef | null;
  Customer?: ReturnCustomerRef | null;
  User?: ReturnUserRef | null;
  Store?: ReturnStoreRef | null;
  items?: ReturnItemRow[];
}

export interface ReturnListParams {
  page?: number;
  limit?: number;
  search?: string;
  refund_method?: string;
  status?: string;
}

/** How a customer's website return is refunded when approved. */
export type RequestRefundMethod = 'original' | 'credit' | 'bank' | 'upi' | 'cash';

export interface ApproveRequestPayload {
  refund_method: RequestRefundMethod;
  restocking_fee: number;
  restock: boolean;
  notes?: string;
}

export interface ApproveRequestResult {
  return: ReturnRecord;
  refund: { method: string; amount: number; status: 'recorded' | 'refunded' | 'manual' | 'failed'; reference?: string; message?: string };
}

export interface SaleItemForReturn {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
  variant_id: number | null;
}

export interface SaleForReturn {
  id: number;
  invoice_number: string;
  customer_id: number | null;
  sale_date?: string;
  created_at?: string;
  total_amount: number | string;
  Customer?: { id: number; name: string } | null;
  items?: SaleItemForReturn[];
}

export interface CreateReturnItemPayload {
  sale_item_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  restock: number;
}

export interface CreateReturnPayload {
  sale_id: number;
  store_id: number;
  items: CreateReturnItemPayload[];
  restocking_fee: number;
  refund_method: string;
  notes: string;
  return_reason: string;
}

export interface ScannedProduct {
  id: number;
  name: string;
}
