export interface UomValue {
  id: number;
  unit_id: number;
  value: string | number;
  is_active: number;
}

export interface Unit {
  id: number;
  store_id: number | null;
  name: string;
  symbol: string | null;
  is_active: number;
  UomValues?: UomValue[];
}

export interface UnitListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
