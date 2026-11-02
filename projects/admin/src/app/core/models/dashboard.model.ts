import { TenantStatus } from './tenant.model';

export interface DashboardCounts {
  total: number;
  active: number;
  suspended: number;
  provisioning: number;
  provisioning_failed: number;
}

export interface RecentTenant {
  id: number;
  name: string;
  slug: string;
  status: TenantStatus;
  created_at: string;
}

export interface AttentionItem {
  tenant_id: number;
  type: 'provisioning_failed' | 'domain_unverified';
  detail: string;
}

export interface ModuleUsage {
  key: string;
  label: string;
  tenants: number;
}

export interface SignupTrendPoint {
  date: string;
  count: number;
}

export interface DashboardData {
  counts: DashboardCounts;
  signup_trend: SignupTrendPoint[];
  recent_tenants: RecentTenant[];
  attention: AttentionItem[];
  module_usage: ModuleUsage[];
}
