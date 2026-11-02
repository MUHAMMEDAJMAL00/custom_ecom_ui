export interface StoreRef {
  id: number;
  name: string;
  code: string;
  currency: string;
  allow_negative_stock: number;
  is_primary: number;
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  role_id: number;
  store_id: number | null;
  allow_negative_stock: number;
  last_login: string | null;
  permissions: Record<string, boolean>;
  stores: StoreRef[];
}

export interface LoginResult {
  token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface Session {
  token: string;
  refreshToken: string;
  user: AuthUser;
  activeStoreId: number | null;
}
