export interface Store {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  is_active: number;
  allow_negative_stock: number;
  created_at?: string;
}

export interface StoreListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}

export interface CreateStorePayload {
  name: string;
  code?: string;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  address: string | null;
  is_active: number;
  allow_negative_stock: number;
}
