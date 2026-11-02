import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartLine, CheckoutQuote, CustomerAddress } from '../../core/models/customer.model';
import { CartService } from '../../core/services/cart.service';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { CustomerOrderService, PlaceOrderPayload } from '../../core/services/customer-order.service';
import { ShopContextService } from '../../core/services/shop-context.service';
import { resolveImageUrl } from '../../core/utils/image.util';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface AddressDraft {
  name: string;
  phone: string;
  address_type: string;
  full_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: number;
}

const EMPTY_ADDRESS: AddressDraft = {
  name: '',
  phone: '',
  address_type: 'Home',
  full_address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: 0,
};

/** /checkout — address, coupon, payment and server-priced order placement. */
@Component({
  selector: 'app-checkout-page',
  standalone: false,
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.scss'],
})
export class CheckoutPageComponent implements OnInit, OnDestroy {
  addresses: CustomerAddress[] = [];
  selectedId: number | null = null;
  lines: CartLine[] = [];
  quote: CheckoutQuote | null = null;
  quoteError = '';
  quoteLoading = false;

  couponInput = '';
  appliedCoupon = '';
  discountsEnabled = false;
  onlineEnabled = false;
  payment: 'cod' | 'online' = 'cod';

  currency = 'INR';
  shopName = '';
  customerName = '';
  customerEmail = '';
  customerPhone = '';

  loadingAddresses = true;
  showAddressForm = false;
  addressDraft: AddressDraft = { ...EMPTY_ADDRESS };
  savingAddress = false;
  addressError = '';

  placing = false;
  placed = false;
  error = '';

  private sub?: Subscription;
  private paymentHandled = false;

  constructor(
    readonly cart: CartService,
    readonly auth: CustomerAuthService,
    private orders: CustomerOrderService,
    private shop: ShopContextService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => {
      this.currency = ctx.bootstrap.tenant.currency || 'INR';
      this.shopName = ctx.bootstrap.tenant.name;
      this.discountsEnabled = ctx.bootstrap.features['discounts'] === true;
      this.onlineEnabled = ctx.bootstrap.features['online_payments'] === true;
    });

    this.auth.user$.subscribe((user) => {
      if (!user) return;
      this.customerName = user.name || '';
      this.customerEmail = user.email || '';
      this.customerPhone = user.phone || '';
      this.addressDraft.name = this.addressDraft.name || this.customerName;
      this.addressDraft.phone = this.addressDraft.phone || this.customerPhone;
    });

    this.loadAddresses();
    this.sub = this.cart.lines$.subscribe((lines) => {
      this.lines = lines;
      if (lines.length && !this.placed) this.refreshQuote();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get selected(): CustomerAddress | null {
    return this.addresses.find((address) => address.id === this.selectedId) || null;
  }

  get subtotal(): number {
    return this.quote?.subtotal ?? this.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  }

  get total(): number {
    return this.quote?.total ?? this.subtotal;
  }

  image(line: CartLine): string {
    return resolveImageUrl(line.image_url);
  }

  select(address: CustomerAddress): void {
    this.selectedId = address.id;
  }

  applyCoupon(): void {
    if (!this.couponInput.trim()) return;
    this.appliedCoupon = this.couponInput.trim().toUpperCase();
    this.refreshQuote();
  }

  removeCoupon(): void {
    this.appliedCoupon = '';
    this.couponInput = '';
    this.refreshQuote();
  }

  startAddress(): void {
    this.showAddressForm = true;
    this.addressError = '';
    this.addressDraft = {
      ...EMPTY_ADDRESS,
      name: this.customerName,
      phone: this.customerPhone,
      is_default: this.addresses.length ? 0 : 1,
    };
  }

  cancelAddress(): void {
    this.showAddressForm = false;
    this.addressError = '';
  }

  saveAddress(): void {
    this.addressError = '';
    if (!this.addressDraft.name.trim() || !this.addressDraft.phone.trim() || !this.addressDraft.full_address.trim()) {
      this.addressError = 'Name, phone and address are required.';
      return;
    }
    if (!/^[0-9]{6}$/.test(this.addressDraft.postal_code)) {
      this.addressError = 'PIN code must be 6 digits.';
      return;
    }

    this.savingAddress = true;
    const body = {
      ...this.addressDraft,
      name: this.addressDraft.name.trim(),
      phone: this.addressDraft.phone.trim(),
      full_address: this.addressDraft.full_address.trim(),
      city: this.addressDraft.city.trim(),
      state: this.addressDraft.state.trim(),
      postal_code: this.addressDraft.postal_code.trim(),
      country: (this.addressDraft.country || 'India').trim(),
      is_default: this.addressDraft.is_default ? 1 : 0,
    };
    this.auth.request<CustomerAddress>('POST', '/storefront/addresses', body).subscribe({
      next: (address) => {
        this.savingAddress = false;
        this.showAddressForm = false;
        this.addresses = [...this.addresses, address];
        this.selectedId = address.id;
      },
      error: (err: HttpErrorResponse) => {
        this.savingAddress = false;
        this.addressError = CustomerAuthService.errorMessage(err, 'Could not save this address.');
      },
    });
  }

  placeOrder(): void {
    this.error = '';
    if (!this.lines.length) {
      this.error = 'Your cart is empty.';
      return;
    }
    if (!this.selected) {
      this.error = 'Choose a delivery address.';
      return;
    }
    if (!this.quote) {
      this.error = 'The order total is still loading. Please try again in a moment.';
      return;
    }

    const payload: PlaceOrderPayload = {
      items: this.cart.checkoutItems(),
      coupon_code: this.appliedCoupon || null,
      payment_method: this.payment,
      shipping_address: {
        name: this.selected.name,
        phone: this.selected.phone,
        address: this.selected.full_address,
        city: this.selected.city,
        state: this.selected.state,
        postal_code: this.selected.postal_code,
        country: this.selected.country || 'India',
      },
    };

    if (this.payment === 'cod') {
      this.submit(payload);
      return;
    }
    this.startOnlinePayment(payload);
  }

  private submit(payload: PlaceOrderPayload): void {
    this.placing = true;
    this.orders.placeOrder(payload).subscribe({
      next: (order) => {
        this.placed = true;
        this.placing = false;
        this.cart.clear();
        void this.router.navigate(['/checkout/success', order.public_id]);
      },
      error: (err: HttpErrorResponse) => {
        this.placing = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not place your order.');
      },
    });
  }

  private startOnlinePayment(payload: PlaceOrderPayload): void {
    this.placing = true;
    this.paymentHandled = false;
    this.orders.createRazorpayOrder(payload.items, payload.coupon_code).subscribe({
      next: (order) => {
        if (order.mock) {
          this.submit({ ...payload, razorpay_order_id: order.id });
          return;
        }
        this.openRazorpay(order, payload);
      },
      error: (err: HttpErrorResponse) => {
        this.placing = false;
        this.error = CustomerAuthService.errorMessage(
          err,
          'Online payment is not available right now. Please choose Cash on Delivery.',
        );
      },
    });
  }

  private openRazorpay(
    order: { id: string; amount: number; currency: string; key: string | null },
    payload: PlaceOrderPayload,
  ): void {
    this.loadRazorpay()
      .then(() => {
        if (!window.Razorpay || !order.key) throw new Error('Payment could not be started.');
        const checkout = new window.Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: this.shopName,
          description: 'Order payment',
          order_id: order.id,
          prefill: {
            name: payload.shipping_address.name,
            email: this.customerEmail,
            contact: payload.shipping_address.phone,
          },
          handler: (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            this.paymentHandled = true;
            this.submit({
              ...payload,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              if (this.paymentHandled || this.placed) return;
              this.placing = false;
              this.error = 'Payment was cancelled. Your cart is unchanged.';
            },
          },
        });
        checkout.open();
      })
      .catch((err: Error) => {
        this.placing = false;
        this.error = err.message || 'Could not open the payment window.';
      });
  }

  private loadRazorpay(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Could not load the payment window.')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset['razorpay'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Could not load the payment window.'));
      document.body.appendChild(script);
    });
  }

  private refreshQuote(): void {
    const items = this.cart.checkoutItems();
    if (!items.length) {
      this.quote = null;
      return;
    }
    this.quoteLoading = true;
    this.quoteError = '';
    this.orders.quote(items, this.appliedCoupon || null).subscribe({
      next: (quote) => {
        this.quote = quote;
        this.quoteLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.quoteLoading = false;
        this.quote = null;
        this.quoteError = CustomerAuthService.errorMessage(err, 'Could not calculate your total.');
      },
    });
  }

  private loadAddresses(): void {
    this.auth.request<CustomerAddress[]>('GET', '/storefront/addresses').subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.selectedId = (addresses.find((address) => address.is_default) || addresses[0])?.id ?? null;
        this.loadingAddresses = false;
        if (!addresses.length) this.startAddress();
      },
      error: () => {
        this.loadingAddresses = false;
      },
    });
  }
}
