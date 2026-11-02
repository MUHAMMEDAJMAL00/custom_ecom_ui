export type DiscountType = 'flat' | 'percent' | 'bogo' | 'bulk' | 'min_qty' | 'spend_get' | 'category' | 'bundle' | 'free_item';
export type ApplyTo = 'all' | 'category' | 'product';
export type CustomerGroup = 'all' | 'member' | 'vip' | 'wholesale';
export type DiscountValueType = 'percent' | 'flat';

export interface DiscountTier {
  id?: number;
  min_qty: number;
  discount_value: number;
  discount_type: DiscountValueType;
}

export interface Discount {
  id: number;
  store_id: number;
  name: string;
  code: string | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number | string;
  discount_value_type: DiscountValueType;
  min_order_amount: number | string;
  max_discount_amount: number | string | null;
  apply_to: ApplyTo;
  apply_to_id: number | null;
  customer_group: CustomerGroup;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number | null;
  start_date: string | null;
  end_date: string | null;
  bogo_buy_qty: number;
  bogo_get_qty: number;
  bogo_max_times: number;
  bogo_get_product_id: number | null;
  min_qty: number;
  category_id: number | null;
  free_product_id: number | null;
  tax_handling: 'before_discount' | 'after_discount';
  single_use_per_bill: number;
  max_per_transaction: number | null;
  is_active: number;
  category_name?: string;
  tiers?: DiscountTier[];

  // Website → Offers (same row: both admin pages edit it)
  show_on_website: number;
  web_title: string | null;
  web_highlight: string | null;
  web_note: string | null;
  web_badge: string | null;
  web_icon: string | null;
  web_sort_order: number;

  /** What the discount is assigned to (from the server) */
  target?: DiscountTarget;
  bogo_get_product_name?: string | null;
  free_product_name?: string | null;
  /** BOGO "buy" products / bundle members */
  offer_products?: { product_id: number; product?: { id: number; name: string; sku?: string } }[];
  /** Sent on save: comma-separated or array of product ids for offer_products */
  offer_product_ids?: number[] | string;
}

export type DiscountTarget =
  | { type: 'all' }
  | { type: 'product'; id: number; name: string | null }
  | { type: 'products'; products: { id: number; name: string | null }[] }
  | { type: 'category'; id: number; name: string | null };

export interface DiscountListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  discount_type?: string;
  /** '1' = only offers shown on the website, '0' = only hidden ones */
  show_on_website?: string;
  /** 'website' = storefront display order */
  sort?: 'website';
}
