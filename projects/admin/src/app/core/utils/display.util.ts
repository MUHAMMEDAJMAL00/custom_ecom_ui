import { TenantStatus } from '../models/tenant.model';

export function tenantStatusLabel(status: TenantStatus | string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'suspended':
      return 'Suspended';
    case 'provisioning':
      return 'Provisioning';
    case 'provisioning_failed':
      return 'Failed';
    case 'deleted':
      return 'Deleted';
    default:
      return status;
  }
}

export function tenantStatusClass(status: TenantStatus | string): string {
  switch (status) {
    case 'active':
      return 'status-active';
    case 'suspended':
      return 'status-suspended';
    case 'provisioning':
      return 'status-provisioning';
    case 'provisioning_failed':
      return 'status-failed';
    case 'deleted':
      return 'status-deleted';
    default:
      return 'status-neutral';
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}
