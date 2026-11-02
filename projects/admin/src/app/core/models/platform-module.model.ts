export interface PlatformModule {
  key: string;
  label: string;
  group: string;
  description: string | null;
  is_core: boolean;
  default_on?: boolean;
  is_built: boolean;
  depends_on: string[];
  permission_modules: string[];
  status?: string;
  sort_order?: number;
  tenants?: number;
}

export interface ModuleGroup {
  name: string;
  modules: PlatformModule[];
}
