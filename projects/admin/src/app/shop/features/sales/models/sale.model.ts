export interface SaleCustomerRef {
  id: number;
  name: string;
  phone: string | null;
}

export interface SaleUserRef {
  id: number;
  name: string;
}

export interface SaleStoreRef {
  id: number;
  name: string;
  code: string;
}

export interface TaxGroupRef {
  id: number;
  name: string;
  rate: number;
  tax_type: string;
  components?: Array<{ name: string; rate: number }>;
}

export interface SaleItemRow {
  id: number;
  product_id: number | null;
  variant_id: number | null;
  product_name: string;
  product_sku: string | null;
  quantity: number | string;
  unit_price: number | string;
  discount_amount: number | string;
  tax_rate: number | string | null;
  tax_amount: number | string;
  total_price: number | string;
  purchase_price?: number | string;
  cost?: number;
  profit?: number;
  Product?: { id: number; name: string; sku: string } | null;
  ProductVariant?: { id: number; variant_name: string; sku: string; selling_price: number } | null;
}

export interface SalePaymentRow {
  id: number;
  payment_method: string;
  payment_source_name: string | null;
  amount: number | string;
  reference_number: string | null;
  notes: string | null;
  payment_date: string;
}

export interface TaxBreakdownItem {
  name: string;
  rate?: number;
  amount: number;
}

export type SaleStatus = 'completed' | 'draft' | 'cancelled' | 'returned' | 'partial_return';
export type SalePaymentStatus = 'paid' | 'partial' | 'unpaid' | 'refunded';

export interface Sale {
  id: number;
  invoice_number: string;
  store_id: number;
  user_id: number;
  customer_id: number | null;
  sale_date: string;
  status: SaleStatus;
  subtotal: number | string;
  discount_type: string;
  discount_value: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  shipping_charge: number | string;
  round_off: number | string;
  total_amount: number | string;
  total_cost: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  payment_status: SalePaymentStatus;
  notes: string | null;
  invoice_tax_mode: string;
  invoice_tax_group_id: number | null;
  invoice_tax_percentage: number | null;
  invoice_tax_amount: number | null;
  total_profit?: number;
  tax_breakdown?: TaxBreakdownItem[];
  Customer?: SaleCustomerRef | null;
  User?: SaleUserRef | null;
  Store?: SaleStoreRef | null;
  items?: SaleItemRow[];
  payments?: SalePaymentRow[];
  TaxGroup?: TaxGroupRef | null;
  created_at?: string;
}

export interface SaleStats {
  total_orders: number;
  total_revenue: number;
  total_collected: number;
  total_due: number;
}

export interface SaleListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  payment_status?: string;
  from?: string;
  to?: string;
}

export interface AddSalePaymentPayload {
  payment_method: string;
  amount: number;
  reference_number: string | null;
  notes: string | null;
}
