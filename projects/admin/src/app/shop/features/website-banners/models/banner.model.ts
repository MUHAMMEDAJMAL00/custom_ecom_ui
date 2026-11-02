export interface Banner {
  id: number;
  placement: string;
  eyebrow: string | null;
  title: string;
  title_line2: string | null;
  text: string | null;
  cta_label: string | null;
  script: string | null;
  image_url: string | null;
  products_image_url: string | null;
  category_id: number | null;
  link_url: string | null;
  sort_order: number;
  is_active: number;
  category?: { id: number; name: string } | null;
}

export interface BannerListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  placement?: string;
}
