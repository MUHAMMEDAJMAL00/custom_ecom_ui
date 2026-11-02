export type PaymentSourceType = 'cash' | 'upi' | 'card' | 'bank' | 'other';

export interface PaymentSource {
  id: number;
  name: string;
  type: PaymentSourceType;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  notes: string | null;
}
