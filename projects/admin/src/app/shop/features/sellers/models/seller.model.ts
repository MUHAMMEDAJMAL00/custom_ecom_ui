export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type PayoutStatus = 'pending' | 'paid' | 'cancelled';

export interface SellerStats {
  products: number;
  orders: number;
  gross: number;
  commission: number;
  earnings: number;
}

export interface Seller {
  id: number;
  store_id: number | null;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  gst_number: string | null;
  pan_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  upi_id: string | null;
  commission_rate: number | string | null;
  status: SellerStatus;
  rejection_reason: string | null;
  approved_at: string | null;
  last_login: string | null;
  created_at: string;
  effective_commission_rate?: number | string;
  stats?: SellerStats;
}

export interface SellerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface SellerPayoutLine {
  id: number;
  sale_id: number;
  product_name: string;
  quantity: number;
  total_price: number | string;
  commission_amount: number | string;
  seller_earning: number | string;
}

export interface SellerPayoutPreview {
  period_to: string;
  line_count: number;
  gross_sales: number | string;
  commission_amount: number | string;
  net_payable: number | string;
  lines: SellerPayoutLine[];
}

export interface SellerPayout {
  id: number;
  seller_id: number;
  payout_number: string;
  period_from: string | null;
  period_to: string;
  line_count: number;
  gross_sales: number | string;
  commission_amount: number | string;
  net_payable: number | string;
  status: PayoutStatus;
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  Seller?: {
    id: number;
    business_name: string;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_ifsc: string | null;
    upi_id: string | null;
  };
}

export interface PayoutListParams {
  page?: number;
  limit?: number;
  status?: string;
  seller_id?: number;
}

export interface MarkPaidPayload {
  payment_method: string;
  payment_reference?: string | null;
  notes?: string | null;
}
