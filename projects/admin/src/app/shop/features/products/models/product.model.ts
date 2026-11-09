export interface CategoryOption {
  id: number;
  name: string;
  slug?: string;
}

export interface NamedOption {
  id: number;
  name: string;
}

export interface SellerOption {
  id: number;
  business_name: string;
}

export interface UnitOption {
  id: number;
  name: string;
  is_active?: number;
}

export interface TaxGroupOption {
  id: number;
  name: string;
  tax_type: 'inclusive' | 'exclusive';
  rate: number;
  components?: Array<{ name: string; rate: number }>;
}

export interface ProductVariantItem {
  id?: number;
  variant_name: string;
  sku?: string | null;
  barcode?: string | null;
  purchase_price: number;
  selling_price: number;
  mrp: number | null;
  quantity: number | null;
  unit: string | null;
  image_url: string | null;
  is_active: number;
  _imageFile?: File | null;
}

export interface ProductInventoryRow {
  quantity: string | number;
  store_id: number;
  variant_id: number | null;
}

export interface Product {
  id: number;
  store_id: number;
  category_id: number | null;
  tax_group_id: number | null;
  discount_id: number | null;
  name: string;
  sku: string;
  barcode: string | null;
  hsn_code: string | null;
  description: string | null;
  brand: string | null;
  brand_id?: number | null;
  seller_id?: number | null;
  BrandRef?: { id: number; name: string; slug: string; logo_url: string | null } | null;
  Seller?: { id: number; business_name: string } | null;
  unit_id: number | null;
  unit_value: string | null;
  purchase_price: string | number;
  selling_price: string | number;
  mrp: string | number | null;
  tax_rate: string | number;
  tax_included: number;
  image_url: string | null;
  gallery_urls?: string[] | null;
  is_active: number;
  is_service: number;
  alert_quantity: number;
  max_quantity: number | null;
  Category?: CategoryOption | null;
  UnitRef?: { name: string } | null;
  TaxGroup?: TaxGroupOption | null;
  ProductInventories?: ProductInventoryRow[];
  Variants?: ProductVariantItem[];
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  is_active?: string;
  category_id?: string;
}
