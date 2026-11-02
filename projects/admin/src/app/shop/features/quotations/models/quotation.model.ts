export interface QuotationCustomerRef {
  id: number;
  name: string;
  phone: string | null;
}

export interface QuotationUserRef {
  id: number;
  name: string;
}

export interface QuotationStoreRef {
  id: number;
  name: string;
  code: string;
}

export interface QuotationItemRow {
  id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  quantity: number | string;
  unit_price: number | string;
  discount_amount: number | string;
  tax_rate: number | string;
  tax_amount: number | string;
  total_price: number | string;
  ProductVariant?: { id: number; variant_name: string } | null;
}

export type QuotationStatus = 'pending' | 'approved' | 'converted' | 'expired' | 'cancelled' | 'rejected';

export interface Quotation {
  id: number;
  quotation_number: string;
  store_id: number;
  user_id: number;
  customer_id: number | null;
  customer_name: string | null;
  valid_until: string | null;
  status: QuotationStatus;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  notes: string | null;
  converted_sale_id: number | null;
  quotation_date?: string;
  created_at: string;
  Customer?: QuotationCustomerRef | null;
  User?: QuotationUserRef | null;
  Store?: QuotationStoreRef | null;
  items?: QuotationItemRow[];
}

export interface QuotationVersionRecord {
  id: number;
  quotation_id: number;
  version_number: number;
  snapshot: string;
  changed_by: number;
  change_notes: string | null;
  created_at: string;
  changedBy?: { id: number; name: string } | null;
}

export interface QuotationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface QuotationItemPayload {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface CreateQuotationPayload {
  store_id: number;
  items: QuotationItemPayload[];
  customer_id?: number;
  valid_until?: string;
  notes?: string;
}

export interface UpdateQuotationPayload {
  items: QuotationItemPayload[];
  customer_id: number | null;
  valid_until: string | null;
  notes: string | null;
  change_notes: string | null;
}

export interface ConvertQuotationPayload {
  payment_method: string;
  amount: number;
}
