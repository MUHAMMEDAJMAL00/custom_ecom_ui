import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CheckoutLine, CheckoutQuote, CustomerOrder } from '../models/customer.model';
import { CustomerAuthService } from './customer-auth.service';

export interface OrderPage {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: CustomerOrder[];
}

export interface PlaceOrderPayload {
  items: CheckoutLine[];
  coupon_code?: string | null;
  payment_method: 'cod' | 'online';
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  notes?: string | null;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  mock: boolean;
  key: string | null;
}

/** Checkout and order calls; every query is scoped by the customer token. */
@Injectable({ providedIn: 'root' })
export class CustomerOrderService {
  constructor(private auth: CustomerAuthService) {}

  quote(items: CheckoutLine[], couponCode?: string | null): Observable<CheckoutQuote> {
    return this.auth.request<CheckoutQuote>('POST', '/storefront/checkout/quote', {
      items,
      coupon_code: couponCode || null,
    });
  }

  createRazorpayOrder(items: CheckoutLine[], couponCode?: string | null): Observable<RazorpayOrderResponse> {
    return this.auth.request<RazorpayOrderResponse>('POST', '/storefront/payments/razorpay-order', {
      items,
      coupon_code: couponCode || null,
      currency: 'INR',
    });
  }

  placeOrder(payload: PlaceOrderPayload): Observable<CustomerOrder> {
    return this.auth.request<CustomerOrder>('POST', '/storefront/orders', payload);
  }

  myOrders(page = 1, status = ''): Observable<OrderPage> {
    const query = new URLSearchParams({ page: String(page), limit: '10' });
    if (status) query.set('status', status);
    return this.auth.requestRaw<OrderPage>('GET', `/storefront/orders?${query.toString()}`);
  }

  order(publicId: string): Observable<CustomerOrder> {
    return this.auth.request<CustomerOrder>('GET', `/storefront/orders/${encodeURIComponent(publicId)}`);
  }

  cancel(publicId: string, reason: string): Observable<CustomerOrder> {
    return this.auth.request<CustomerOrder>('POST', `/storefront/orders/${encodeURIComponent(publicId)}/cancel`, {
      reason: reason || null,
    });
  }

  requestReturn(payload: {
    order_id: string;
    items: { sale_item_id: number; quantity: number; reason?: string }[];
    notes?: string;
  }): Observable<{ id: number; return_number: string; status: string; total_amount: number }> {
    return this.auth.request('POST', '/storefront/returns', payload).pipe(map((result) => result as {
      id: number;
      return_number: string;
      status: string;
      total_amount: number;
    }));
  }
}
