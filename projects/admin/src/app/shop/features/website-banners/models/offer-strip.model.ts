export interface OfferStrip {
  id: number;
  icon: string | null;
  badge: string | null;
  title: string;
  highlight: string | null;
  note: string | null;
  code: string | null;
  sort_order: number;
  is_active: number;
}

export interface OfferStripListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
