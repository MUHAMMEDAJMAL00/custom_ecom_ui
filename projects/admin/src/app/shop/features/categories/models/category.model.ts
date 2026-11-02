export interface CategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface Category {
  id: number;
  store_id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: number;
  parent?: CategoryRef | null;
  children?: CategoryRef[];
  has_children?: boolean;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
}
