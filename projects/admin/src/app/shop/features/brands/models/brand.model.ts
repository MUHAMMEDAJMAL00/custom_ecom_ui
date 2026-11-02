export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: number;
  product_count?: number;
}

export interface BrandListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
