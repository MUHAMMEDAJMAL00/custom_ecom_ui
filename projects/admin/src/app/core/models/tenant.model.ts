export type TenantStatus =
  | 'provisioning'
  | 'provisioning_failed'
  | 'active'
  | 'suspended'
  | 'deleted';

export interface TenantOwner {
  id: number;
  tenant_id: number;
  name: string;
  email: string | null;
  username: string;
  last_login: string | null;
}

export interface Tenant {
  id: number;
  public_id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  gstin: string | null;
  email: string;
  phone: string | null;
  status: TenantStatus;
  currency: string;
  timezone: string;
  locale: string;
  layout_template: string;
  logo_url: string | null;
  favicon_url: string | null;
  suspended_reason: string | null;
  suspended_at: string | null;
  deleted_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  primary_domain: string | null;
  owner: TenantOwner | null;
  module_count: number;
}

export interface TenantListFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface TenantDomain {
  id: number;
  tenant_id: number;
  domain: string;
  type: 'subdomain' | 'custom' | 'path';
  is_primary: boolean;
  verify_token: string | null;
  verified_at: string | null;
  ssl_status: string;
  created_at: string;
  dns_instructions?: { type: string; name: string; value: string }[];
}

export interface TenantDetail {
  id: number;
  name: string;
  slug: string;
  status: TenantStatus;
  email: string;
  domains: TenantDomain[];
}
