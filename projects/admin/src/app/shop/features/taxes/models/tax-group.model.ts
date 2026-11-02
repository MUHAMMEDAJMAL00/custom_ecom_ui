export interface TaxComponent {
  name: string;
  rate: number;
}

export interface TaxGroup {
  id: number;
  store_id: number | null;
  name: string;
  category: 'GST' | 'VAT' | 'Custom';
  description: string | null;
  tax_type: 'inclusive' | 'exclusive';
  rate: string | number;
  components: TaxComponent[] | null;
  is_inter_state: number;
  is_active: number;
}

export interface TaxGroupListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
