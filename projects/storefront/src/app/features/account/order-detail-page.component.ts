import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerOrder, OrderItem } from '../../core/models/customer.model';
import { CustomerAuthService } from '../../core/services/customer-auth.service';
import { CustomerOrderService } from '../../core/services/customer-order.service';
import { ShopContextService } from '../../core/services/shop-context.service';

/** /my-orders/:id — one order, its items, tracking steps, cancel and return actions. */
@Component({
  selector: 'app-order-detail-page',
  standalone: false,
  templateUrl: './order-detail-page.component.html',
  styleUrls: ['./order-detail-page.component.scss'],
})
export class OrderDetailPageComponent implements OnInit {
  order: CustomerOrder | null = null;
  loading = true;
  error = '';
  currency = 'INR';
  returnsEnabled = false;

  readonly steps = [
    { key: 'pending', label: 'Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  cancelOpen = false;
  cancelReason = '';
  cancelling = false;

  returnItem: OrderItem | null = null;
  returnQty = 1;
  returnReason = '';
  returning = false;
  returnError = '';
  returnSuccess = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orders: CustomerOrderService,
    readonly auth: CustomerAuthService,
    private shop: ShopContextService,
  ) {}

  ngOnInit(): void {
    this.shop.load().subscribe((ctx) => {
      this.currency = ctx.bootstrap.tenant.currency || 'INR';
      this.returnsEnabled = ctx.bootstrap.features['returns'] === true;
    });
    this.route.paramMap.subscribe((params) => this.load(params.get('id') || ''));
  }

  get canCancel(): boolean {
    return !!this.order && ['pending', 'confirmed'].includes(this.order.status);
  }

  get canReturn(): boolean {
    return (
      this.returnsEnabled &&
      !!this.order &&
      ['delivered', 'completed', 'partial_return'].includes(this.order.status)
    );
  }

  discountAmount(): number {
    return Number(this.order?.discount_amount || 0);
  }

  load(publicId: string): void {
    if (!publicId) {
      this.error = 'Order not found.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.orders.order(publicId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
        document.title = `Order #${order.invoice_number}`;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not load this order.');
      },
    });
  }

  stepState(key: string): 'done' | 'current' | 'todo' {
    if (!this.order) return 'todo';
    const current = this.steps.findIndex((step) => step.key === this.order!.status);
    const index = this.steps.findIndex((step) => step.key === key);
    if (current < 0) return 'todo';
    if (index < current) return 'done';
    if (index === current) return 'current';
    return 'todo';
  }

  openCancel(): void {
    this.cancelOpen = true;
    this.cancelReason = '';
  }

  cancelOrder(): void {
    if (!this.order) return;
    this.cancelling = true;
    this.orders.cancel(this.order.public_id, this.cancelReason).subscribe({
      next: (order) => {
        this.order = { ...this.order!, ...order };
        this.cancelling = false;
        this.cancelOpen = false;
      },
      error: (err: HttpErrorResponse) => {
        this.cancelling = false;
        this.error = CustomerAuthService.errorMessage(err, 'Could not cancel this order.');
      },
    });
  }

  openReturn(item: OrderItem): void {
    this.returnItem = item;
    this.returnQty = 1;
    this.returnReason = '';
    this.returnError = '';
    this.returnSuccess = '';
  }

  closeReturn(): void {
    if (this.returning) return;
    this.returnItem = null;
  }

  submitReturn(): void {
    if (!this.order || !this.returnItem) return;
    this.returning = true;
    this.returnError = '';
    this.orders
      .requestReturn({
        order_id: this.order.public_id,
        items: [{ sale_item_id: this.returnItem.id, quantity: this.returnQty, reason: this.returnReason }],
        notes: this.returnReason,
      })
      .subscribe({
        next: (result) => {
          this.returning = false;
          this.returnItem = null;
          this.returnSuccess = `Return ${result.return_number} requested. We will review it shortly.`;
        },
        error: (err: HttpErrorResponse) => {
          this.returning = false;
          this.returnError = CustomerAuthService.errorMessage(err, 'Could not request this return.');
        },
      });
  }

  back(): void {
    void this.router.navigate(['/my-orders']);
  }
}
