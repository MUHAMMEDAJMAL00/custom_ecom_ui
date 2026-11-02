export interface AppNotification {
  id: number;
  store_id: number;
  user_id: number;
  type: string;
  title: string | null;
  message: string;
  reference_type: string | null;
  reference_id: number | null;
  is_read: number | boolean;
  created_at: string;
  createdAt?: string;
}

export interface GenerateAlertsResult {
  generated: number;
  alerts: AppNotification[];
}
