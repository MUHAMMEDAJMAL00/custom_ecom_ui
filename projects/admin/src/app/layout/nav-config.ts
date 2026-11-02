export interface NavItem {
  label: string;
  path: string;
  icon: string;
  exact?: boolean;
  disabled?: boolean;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const PLATFORM_NAV: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/platform', icon: 'dashboard', exact: true },
      { label: 'Shops', path: '/platform/tenants', icon: 'building', exact: true },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Create shop',
        path: '/platform/tenants/new',
        icon: 'plus',
      },
      {
        label: 'Module catalogue',
        path: '/platform/modules',
        icon: 'puzzle',
      },
      {
        label: 'Roles & permissions',
        path: '/platform/roles',
        icon: 'key',
      },
      {
        label: 'Platform users',
        path: '/platform/users',
        icon: 'users',
      },
      {
        label: 'Audit log',
        path: '/platform/audit-log',
        icon: 'shield',
      },
    ],
  },
];
