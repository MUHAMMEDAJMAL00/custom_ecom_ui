export interface Asset {
  id: number;
  name: string;
  category: string | null;
  purchase_date: string | null;
  purchase_value: number;
  depreciation_rate: number;
  accumulated_depreciation: number;
  current_book_value: number;
  status: string;
  notes: string | null;
}
