export interface Role {
  id: number;
  name: string;
}

export interface StoreOption {
  id: number;
  name: string;
  is_active: number;
}

export interface AppUser {
  id: number;
  store_id: number | null;
  role_id: number;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  is_active: number;
  last_login: string | null;
  Role?: Role | null;
  Store?: { name: string } | null;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  role_id?: string;
}
