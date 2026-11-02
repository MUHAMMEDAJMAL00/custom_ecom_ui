import { Pipe, PipeTransform } from '@angular/core';

const BADGE_MAP: Record<string, string> = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  pending: 'badge-pending',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  canceled: 'badge-cancelled',
  refunded: 'badge-refunded',
  paid: 'badge-active',
  unpaid: 'badge-pending',
  overdue: 'badge-cancelled',
  low: 'badge-warning',
  enabled: 'badge-active',
  disabled: 'badge-inactive',
};

@Pipe({ name: 'statusBadge', standalone: false })
export class StatusBadgePipe implements PipeTransform {
  transform(value: unknown): string {
    const key = String(value ?? '').toLowerCase();
    return BADGE_MAP[key] || 'badge-inactive';
  }
}
