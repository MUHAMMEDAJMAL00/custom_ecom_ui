export interface Vendor {
  id: number;
  store_id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  opening_balance: number | string;
  balance: number | string;
  notes: string | null;
  is_active: number;
}

export interface VendorPurchase {
  id: number;
  purchase_number: string;
  purchase_date: string;
  total_amount: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  payment_status?: string;
  status?: string;
}

export interface VendorPayment {
  id: number;
  payment_date: string;
  amount: number | string;
  payment_method: string;
  reference_number: string | null;
  Purchase?: { purchase_number: string } | null;
}

export interface VendorListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
