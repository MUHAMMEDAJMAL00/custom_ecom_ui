export type PlatformRole = 'platform_owner' | 'platform_operations' | 'platform_support' | string;

export interface PlatformUser {
  id: number;
  name: string;
  email: string;
  role: PlatformRole;
  role_id?: number | null;
  role_label?: string;
  permissions?: string[];
  last_login_at: string | null;
}

export interface PlatformSession {
  token: string;
  refresh_token: string;
  user: PlatformUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
