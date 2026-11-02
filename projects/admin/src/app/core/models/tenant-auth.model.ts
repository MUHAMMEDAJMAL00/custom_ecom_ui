export interface TenantStore {
  id: number;
  name: string;
  code: string;
  currency: string;
  allow_negative_stock: number;
  is_primary: number;
}

export interface TenantUser {
  id: number;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  role_id: number;
  full_access: boolean;
  store_id: number | null;
  allow_negative_stock: number;
  must_change_password: boolean;
  last_login: string | null;
  permissions: Record<string, boolean>;
  stores: TenantStore[];
}

export interface TenantInfo {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  currency: string;
  layout_template: string;
}

export interface TenantSession {
  token: string;
  refresh_token: string;
  user: TenantUser;
  tenant: TenantInfo;
  modules: string[];
}

export interface TenantProfile {
  user: TenantUser;
  tenant: TenantInfo;
  modules: string[];
}

export interface TenantTheme {
  primary: string;
  primary_dark: string;
  tint: string;
  soft: string;
  background: string;
  text: string;
  header: string;
  footer: string;
  button_shape: string;
  button_style: string;
}

export interface TenantBootstrap {
  tenant: {
    name: string;
    slug: string;
    logo_url: string | null;
    favicon_url: string | null;
    currency: string;
    locale: string;
    timezone: string;
    email: string;
    phone: string | null;
  };
  layout_template: string;
  theme: TenantTheme;
  features: Record<string, boolean>;
  navigation: { header: unknown[]; footer: unknown[] };
  seo: { title: string; description: string; keywords: string };
}

export interface TenantModule {
  key: string;
  label: string;
  group: string;
  description: string | null;
  is_core: boolean;
  is_built: boolean;
  depends_on: string[];
  enabled: boolean;
}

export interface TenantLoginCredentials {
  username: string;
  password: string;
}
