export interface AuditLogUser {
  id: number;
  name: string;
  username: string;
}

export interface AuditLogEntry {
  id: number;
  store_id: number;
  user_id: number | null;
  module: string;
  action: string;
  reference_type: string | null;
  reference_id: number | null;
  old_values: string | Record<string, unknown> | null;
  new_values: string | Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  User?: AuditLogUser | null;
}

export interface AuditLogListResult {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  logs: AuditLogEntry[];
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  module?: string;
  action?: string;
  user_id?: string;
  from?: string;
  to?: string;
}
