import { TenantStatus } from './tenant.model';

export type ProvisioningStepStatus = 'pending' | 'running' | 'done' | 'skipped' | 'failed';

export interface ProvisioningStep {
  key: string;
  label: string;
  status: ProvisioningStepStatus;
  note?: string;
}

export interface ProvisioningRun {
  id: number;
  tenant_id: number;
  status: 'running' | 'succeeded' | 'failed';
  current_step: string | null;
  steps: ProvisioningStep[];
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface ProvisionedTenant {
  id: number;
  name: string;
  slug: string;
  status: TenantStatus;
  email: string;
  currency: string;
  layout_template: string;
  created_at: string;
}

export interface CreatedInvite {
  username: string;
  url: string | null;
  expires_in_days: number;
}

export interface TenantCreateResult {
  tenant: ProvisionedTenant;
  run: ProvisioningRun;
  modules_added?: { key: string; needed_by: string }[];
  invite: CreatedInvite | null;
}

export interface ThemeValues {
  primary: string;
  primary_dark: string;
  tint: string;
  soft: string;
  background: string;
  text: string;
  header: string;
  footer: string;
  button_shape: 'pill' | 'rounded' | 'square';
  button_style: 'gradient' | 'solid' | 'outline';
}

export interface CreateTenantPayload {
  profile: {
    name: string;
    slug: string;
    legal_name: string | null;
    gstin: string | null;
    email: string;
    phone: string | null;
    currency: string;
    timezone: string;
    locale: string;
    logo_url: string | null;
    favicon_url: string | null;
  };
  design: {
    layout_template: string;
    theme: ThemeValues;
  };
  modules: string[];
  owner: {
    name: string;
    email: string;
    phone: string | null;
    mode: 'invite' | 'password';
    password?: string;
  };
  starter_content: boolean;
  route: {
    subdomain: string;
    custom_domain: string | null;
  };
}
