/** Storefront customer account, cart, wishlist, checkout and order shapes. */

export interface CustomerUser {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  loyalty_points?: number;
  [key: string]: unknown;
}

export interface CustomerSession {
  token: string;
  refresh_token: string;
  customer: CustomerUser;
}

export interface CustomerAddress {
  id: number;
  name: string;
  phone: string;
  address_type: string;
  full_address: string;
  street?: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: number;
}

export interface CartLine {
  /** Server cart row id; null for a guest cart line. */
  row_id: number | null;
  product_id: number;
  public_id: string;
  variant_id: number | null;
  variant_name: string | null;
  name: string;
  price: number;
  mrp: number;
  image_url: string | null;
  quantity: number;
}

export interface WishlistLine {
  row_id: number | null;
  product_id: number;
  public_id: string;
  name: string;
  price: number;
  mrp: number;
  image_url: string | null;
}

export interface CheckoutLine {
  product_id: number;
  variant_id: number | null;
  quantity: number;
}

export interface CheckoutQuote {
  lines: {
    product_id: number;
    variant_id: number | null;
    name: string;
    image_url: string | null;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    base_price: number;
    tax_amount: number;
    line_total: number;
  }[];
  subtotal: number;
  tax: number;
  shipping: number;
  coupon: { discount_id: number; code: string | null; name: string; discount: number; auto: boolean } | null;
  discount: number;
  round_off: number;
  total: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  product_sku?: string | null;
  quantity: string | number;
  unit_price: string | number;
  total_price: string | number;
  Product?: { id: number; public_id: string } | null;
}

export interface OrderPayment {
  id: number;
  payment_method: string;
  amount: string | number;
  status?: string | null;
}

export interface CustomerOrder {
  id: number;
  public_id: string;
  invoice_number: string;
  status: string;
  payment_status: string;
  source: string;
  subtotal: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  shipping_charge: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  coupon_code?: string | null;
  coupon_discount?: string | number;
  shipping_name?: string | null;
  shipping_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_state?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  sale_date?: string;
  createdAt?: string;
  created_at?: string;
  items?: OrderItem[];
  payments?: OrderPayment[];
}
